import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {LocalLoginHandler} from "./local-login.handler";
import {localLoginSchema} from "../../collections/local-login/local-login.schema";
import {LocalLogin} from "../../collections/local-login/local-login";
import {SEDbQuery} from "../../query/se.db-query";
import {Promise} from 'es6-promise';
import {BlError} from "bl-model";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import * as local from "commander";

chai.use(chaiAsPromised);

const dummyLocalLogin = {
	username: "albert@protonmail.com",
	provider: "local",
	providerId: "123",
	hashedPassword: "abc",
	salt: "car"
};

describe('LocalLoginHandler', () => {
	
	let localLoginStorage = new BlDocumentStorage<LocalLogin>('locallogins', localLoginSchema);
	
	let localLoginHandler = new LocalLoginHandler(localLoginStorage);
	
	describe('create()', () => {
		let baseLocalLogin = {id: '1', username: 'a', providerId: '1', hashedPassword: 'b', provider: 'c', salt: 'h'};
		let testLocalLogin: LocalLogin = baseLocalLogin;
		
		beforeEach((done) => {
			testLocalLogin = {id: 'abc', username: 'albert@gmail.com', provider: 'local', providerId: 'i', hashedPassword: 'abc', salt: 'l'};
			done();
		});
		
		sinon.stub(localLoginStorage, 'add').callsFake((localLogin: any, user: any) => {
			return new Promise((resolve, reject) => {
				resolve(testLocalLogin);
			});
		});
		
		describe('should reject with TypeError when', () => {
			
			
			it('username is empty or undefined', () => {
				testLocalLogin.username = '';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
			
			it('provider is empty or undefiend', () => {
				testLocalLogin.provider = '';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
			
			it('providerId is empty or undefined', () => {
				testLocalLogin.providerId = '';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
			
			it('hashedPassword is empty or undefined', () => {
				testLocalLogin.hashedPassword = '';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
			
			it('salt is empty or undefined', () => {
				testLocalLogin.salt = '';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
		});
		
		describe('should reject with TypeError when', () => {
			
			it('username is "alb@"', () => {
				testLocalLogin.username = 'alb@';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is "bill@mail."', () => {
				testLocalLogin.username = 'bill@mail.';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is "alli @mail.com"', () => {
				testLocalLogin.username = 'alli @mail.com';
				return localLoginHandler.add(testLocalLogin)
					.should.be.rejectedWith(BlError);
			});
		});
		
		
		
		it('should resolve when LocalLogin is valid', () => {
			return localLoginHandler.add(testLocalLogin)
				.should.eventually.eq(testLocalLogin);
		});
		
	});
	
	describe('get()', () => {
		let testUsername = "";
		
		beforeEach(() => {
			testUsername = "albert@protonmail.com";
		});
		
		
		describe('should reject with TypeError when', () => {
			
			it('username is not a valid Email', () => {
				testUsername = "al";
				return localLoginHandler.get(testUsername)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is not empty', () => {
				testUsername = "";
				return localLoginHandler.get(testUsername)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is null', () => {
				testUsername = null;
				return localLoginHandler.get(testUsername)
					.should.be.rejectedWith(BlError);
			});
			
		});
		
		sinon.stub(localLoginStorage, 'getByQuery').callsFake((query: SEDbQuery) => {
			return new Promise((resolve, reject) => {
			    if (query.stringFilters[0].value === testUsername) {
			    	resolve([dummyLocalLogin]);
				}
				reject(new BlError('not found').code(702));
			});
		});
		
		it('should reject with blError.code 702 when username is not found in db', (done) => {
			localLoginHandler.get('notFound@mail.com').catch((blError: BlError) => {
				expect(blError.getCode()).to.eql(702);
				done();
			});
		});
		
		it('should resolve with LocalLogin object when username is found', () => {
			return localLoginHandler.get(testUsername)
				.should.eventually.eq(dummyLocalLogin);
		});
		
		
	});
});


