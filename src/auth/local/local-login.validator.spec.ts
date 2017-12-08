import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {LocalLoginHandler} from "./local-login.handler";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {LocalLoginValidator} from "./local-login.validator";
import {SESchema} from "../../config/schema/se.schema";
import {LocalLoginSchema} from "../../config/schema/login-local/local-login.schema";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {LocalLoginPasswordValidator} from "./password/local-login-password.validator";
import {SeCrypto} from "../../crypto/se.crypto";
import {Promise} from "es6-promise";
import {BlError} from "../../bl-error/bl-error";

chai.use(chaiAsPromised);

const testLocalLogin = {
	username: "albert@protonmail.com",
	provider: "local",
	providerId: "123",
	hashedPassword: "a",
	salt: "dog"
};

class LocalLoginHandlerMock extends LocalLoginHandler {
	
	
	get(username: string): Promise<LocalLogin> {
		return new Promise((resolve, reject) => {
		    resolve(testLocalLogin);
		});
	}
	
	
	add(localLogin: LocalLogin): Promise<LocalLogin> {
		return new Promise((resolve, reject) => {
			resolve(localLogin);
		});
	}
}

class LocalLoginPasswordValidatorMock extends LocalLoginPasswordValidator {
	
	validate(password: string, salt: string, hashedPassword): Promise<boolean> {
		return new Promise((resolve, reject) => {
			resolve(true);
		
		});
	}
}


describe('LocalLoginValidator', () => {
	let localLoginEndpointMongoDb = new EndpointMongodb(new SESchema('localLogins', LocalLoginSchema));
	let localLoginHandler = new LocalLoginHandlerMock(localLoginEndpointMongoDb);
	let localLoginPasswordValidatorMock = new LocalLoginPasswordValidatorMock(new SeCrypto());
	let localLoginValidator = new LocalLoginValidator(localLoginHandler, localLoginPasswordValidatorMock);
	
	describe('validate()', () => {
		let testUserName = '';
		let testPassword = '';
		
		beforeEach(() => {
			testUserName = "albert@protonmail.com";
			testPassword = 'hello';
		});
		
		describe('should reject with TypeError when', () => {
			it('username is not an email', () => {
				testUserName = 'bill';
				return localLoginValidator.validate(testUserName, testPassword)
					.should.be.rejectedWith(TypeError);
			});
			
			it('password is empty', () => {
				testPassword = '';
				return localLoginValidator.validate(testUserName, testPassword)
					.should.be.rejectedWith(TypeError);
			});
		});
		
		
		it('should resolve with correct provider and providerId when username and password is correct', () => {
			let expectedProvider = {provider: testLocalLogin.provider, providerId: testLocalLogin.providerId};
			return new Promise((resolve, reject) => {
				localLoginValidator.validate(testUserName, testPassword).then(
					(returnedProvider: {provider: string, providerId: string}) => {
						if (returnedProvider.providerId === expectedProvider.providerId) resolve(true);
						reject(new Error('provider is not equal to expectedProvider'));
					},
					(error: any) => {
						reject(error);
					});
			}).should.eventually.be.true;
		});
		
	});
	
	describe('createNewLocalLogin()', () => {
		
		describe('should reject with BlError when', () => {
			it('username is not an email', () => {
				let username = 'abc';
				let password = 'test';
				return localLoginValidator.createNewLocalLogin(username, password)
					.should.be.rejectedWith(BlError);
			});
			
			it('password is undefined', () => {
				let username = 'bill@bill.com';
				let password = undefined;
				return localLoginValidator.createNewLocalLogin(username, password)
					.should.be.rejectedWith(BlError);
			});
			
			it('password is empty', () => {
				let username = 'bill@bill.com';
				let password = '';
				return localLoginValidator.createNewLocalLogin(username, password)
					.should.be.rejectedWith(BlError);
			});
			
			it('password is under 6 chars', () => {
				let username = 'bill@bill.com';
				let password = 'abc';
				return localLoginValidator.createNewLocalLogin(username, password)
					.should.be.rejectedWith(BlError);
			});
		});
		
		describe('should resolve with provider and providerId when', () => {
			it('username and password is valid', () => {
				let username = 'bill@bill.com';
				let password = 'thisIsThePassword';
				
				//return localLoginValidator.createNewLocalLogin(username, password)
				//	.should.be.fulfilled;
			});
		});
	});
});