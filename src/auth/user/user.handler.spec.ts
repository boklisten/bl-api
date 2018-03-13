import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {UserSchema} from "../../config/schema/user/user.schema";
import {UserHandler} from "./user.handler";
import {BlError, UserDetail} from "bl-model";
import {Promise} from 'es6-promise';
import {User} from "../../config/schema/user/user";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import {SEDbQueryBuilder} from "../../query/se.db-query-builder";
import {SEDbQuery} from "../../query/se.db-query";

chai.use(chaiAsPromised);

let testUser = {
	userDetail: '',
	permission: 'customer',
	login: {
		provider: 'local',
		providerId: '123'
	},
	blid: '',
	username: 'bill@gmail.com',
	valid: false
};


describe('UserHandler', () => {
	const userStorage: BlDocumentStorage<User> = new BlDocumentStorage('users', UserSchema);
	const userDetailStorage: BlDocumentStorage<UserDetail> = new BlDocumentStorage('userdetails', UserDetail);
	let userHandler = new UserHandler(userDetailStorage, userStorage);
	let testProvider = '';
	let testProviderId = '';
	let testUsername = '';
	
	beforeEach(() => {
			testProvider = testUser.login.provider;
			testProviderId = testUser.login.providerId;
			testUsername = testUser.username;
		});
	
	describe('get()', () => {
		
		describe('should reject with BlError when', () => {
			
			it('provider is empty', () => {
				let provider = '';
				return userHandler.get(provider, testProviderId)
					.should.rejectedWith(BlError);
			});
			
			it('provider is null', () => {
				let provider = null;
				return userHandler.get(provider, testProviderId)
					.should.rejectedWith(BlError);
			});
			
			it('providerId is null', () => {
				let providerId = null;
				return userHandler.get(testProvider, providerId)
					.should.rejectedWith(BlError);
			});
			
			it('providerId is empty', () => {
				let providerId = '';
				return userHandler.get(testProvider, providerId)
					.should.rejectedWith(BlError);
			});
			
		});
	});
	
	
	sinon.stub(userStorage, 'getByQuery').callsFake((query: SEDbQuery) => {
		return new Promise((resolve, reject) => {
			if (query.stringFilters[0].value !== testUser.username) {
				return reject(new BlError('not found').code(702));
			}
			
			resolve([{username: testUser.username}]);
			
		});
	});
	
	describe('getByUsername()', () => {
		context('when username is undefined', () => {
			it('should reject with BlError', () => {
				let username = undefined;
				return userHandler.getByUsername(username)
					.should.be.rejectedWith(BlError);
			});
		});
		
		context('when username is not found', () => {
			
			it('should reject with BlError code 702 not found', (done) => {
				
				let username = 'thisis@notfound.com';
				
				
				userHandler.getByUsername(username).catch(
					(error: BlError) => {
						error.getCode().should.be.eq(702);
						done();
				});
			});
		});
		
		context('when username is found', () => {
			it('should resolve with a User object', (done) => {
				
				userHandler.getByUsername(testUser.username).then((user: User) => {
					user.username.should.be.eq(testUser.username);
					done();
				});
			});
		});
	});
	
	describe('create()', () => {
		
		describe('should reject whith BlError when', () => {
			it('username is undefined', () => {
				let username = undefined;
				return userHandler.create(username, testProvider, testProviderId)
					.should.be.rejectedWith(BlError);
			});
			
			it('provider is empty', () => {
				let provider = '';
				return userHandler.create(testUsername, provider, testProviderId)
					.should.be.rejectedWith(BlError);
			});
			
			it('providerId is null', () => {
				let providerId = '';
				return userHandler.create(testUsername, testProvider, providerId)
					.should.be.rejectedWith(BlError);
			});
		});
		
		it('should resolve with a user when username, provider and providerId is valid', () => {
			
			sinon.stub(userDetailStorage, 'add').callsFake(() => {
				return new Promise((resolve, reject) => {
				    resolve({id: testUser.userDetail, user: {id: testUser.blid}});
				});
			});
				
			sinon.stub(userStorage, 'add').callsFake((data: any, user: any) => {
				return new Promise((resolve, reject) => {
					resolve(testUser);
				});
			});
			
			
			
			return userHandler.create(testUsername, testProvider, testProviderId).then(
				(user: User) => {
					user.username.should.be.eql(testUser.username);
					user.login.should.be.eql(testUser.login);
				},
				(error: any) => {
					error.should.not.be.fulfilled;
				});
		});
	});
	
	describe('exists()', () => {
		describe('should reject with BlError when', () => {
			it('provider is undefined', () => {
				let provider = undefined;
				return userHandler.exists(provider, testProviderId)
					.should.be.rejectedWith(BlError);
			});
			
			it('providerId is empty', () => {
				let providerId = '';
				return userHandler.exists(testProvider, providerId)
					.should.be.rejectedWith(BlError);
			});
		});
	});
});