import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {SESchema} from "../../config/schema/se.schema";
import {UserSchema} from "../../config/schema/user/user.schema";
import {UserDetailSchema} from "../../config/schema/user/user-detail.schema";
import {UserHandler} from "./user.handler";
import {BlError} from "../../bl-error/bl-error";
import {SEDbQuery} from "../../query/se.db-query";
import {Promise} from 'es6-promise';
import {SEDocument} from "../../db/model/se.document";
import {User} from "../../config/schema/user/user";

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

class EndpointMongoDbMock extends EndpointMongodb {
	exists(dbQuery: SEDbQuery): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (dbQuery.stringFilters[0].value === testUser.login.provider && dbQuery.stringFilters[1].value === testUser.login.providerId) {
				resolve(true);
			}
			reject(new BlError('user does not exists').code(404));
		});
	}
	
	get(dbQuery: SEDbQuery): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
		    if (dbQuery.stringFilters[0].value === testUser.login.provider && dbQuery.stringFilters[1].value === testUser.login.providerId) {
				resolve([new SEDocument('user', testUser)])
			} else {
		    	reject(new BlError('could not find user').code(404));
			}
		});
	}
	
	post(seDocument: SEDocument): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
		    resolve([seDocument]);
		});
	}
	
}

describe('UserHandler', () => {
	let userMongoHandlerMock = new EndpointMongoDbMock(new SESchema('users', UserSchema));
	let userDetailMongoHandlerMock = new EndpointMongoDbMock(new SESchema('userDetails', UserDetailSchema));
	let userHandler = new UserHandler(userMongoHandlerMock, userDetailMongoHandlerMock);
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