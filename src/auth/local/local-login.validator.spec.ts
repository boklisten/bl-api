import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {LocalLoginHandler} from "./local-login.handler";
import {LocalLogin} from "../../collections/local-login/local-login";
import {LocalLoginValidator} from "./local-login.validator";
import {LocalLoginPasswordValidator} from "./password/local-login-password.validator";
import {SeCrypto} from "../../crypto/se.crypto";
import {Promise} from "es6-promise";
import {HashedPasswordGenerator} from "./password/hashed-password-generator";
import {SaltGenerator} from "./salt/salt-generator";
import {LocalLoginCreator} from "./local-login-creator/local-login-creator";
import {ProviderIdGenerator} from "./provider-id/provider-id-generator";
import {BlError} from "bl-model";
import {UserHandler} from "../user/user.handler";
import {User} from "../../collections/user/user";

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
			if (username === testLocalLogin.username) resolve(testLocalLogin);
			reject(new BlError('').code(404));
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

class UserHandlerMock extends UserHandler {
	create(username: string, provider: string, providerId: string) {
		return new Promise((resolve, reject) => {
			let user: User = {
				id: '',
				userDetail: '',
				permission: 'customer',
				login: {
					provider: provider,
					providerId: providerId
				},
				blid: '',
				username: username,
				valid: true,
				active: true,
				lastActive: '',
				lastRequest: ''
				
			};
		    resolve(user);
		});
	}
}


describe('LocalLoginValidator', () => {
	let localLoginPasswordValidatorMock = new LocalLoginPasswordValidatorMock(new SeCrypto());
	let saltGenerator = new SaltGenerator();
	let seCrypto = new SeCrypto();
	let hashedPasswordGenerator = new HashedPasswordGenerator(saltGenerator, seCrypto);
	let providerIdGenerator = new ProviderIdGenerator(seCrypto);
	let localLoginCreator = new LocalLoginCreator(hashedPasswordGenerator, providerIdGenerator);
	let userHandlerMock = new UserHandlerMock();
	let localLoginHandler = new LocalLoginHandlerMock();
	let localLoginValidator = new LocalLoginValidator(localLoginHandler, localLoginPasswordValidatorMock, localLoginCreator, userHandlerMock);
	
	describe('validate()', () => {
		let testUserName = '';
		let testPassword = '';
		
		beforeEach(() => {
			testUserName = "albert@protonmail.com";
			testPassword = 'hello';
		});
		
		describe('should reject with BlError when', () => {
			it('username is not an email', () => {
				testUserName = 'bill';
				return localLoginValidator.validate(testUserName, testPassword)
					.should.be.rejectedWith(BlError);
			});
			
			it('password is empty', () => {
				testPassword = '';
				return localLoginValidator.validate(testUserName, testPassword)
					.should.be.rejectedWith(BlError);
			});
		});
		
		describe('should reject with BlError when', () => {
			it('username does not exist', () => {
				testUserName = 'billy@user.com';
				testPassword = 'thePassword';
				return localLoginValidator.validate(testUserName, testPassword).then(
					(value: any) => {
						value.should.not.be.fulfilled;
					
					},
					(error: BlError) => {
						error.getCode().should.be.eq(404);
					});
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
	
	describe('create()', () => {
		it('should reject with BlError if username does exist', () => {
			let username = testLocalLogin.username;
			let password = 'something';
			
			return localLoginValidator.create(username, password).then(
				(value: any) => {
					value.should.not.be.fulfilled;
				},
				(error: BlError) => {
					error.getMsg().should.contain('already exists');
				});
		});
		
		it('should resolve with provider and providerId if username and password is valid', () => {
			let username = 'amail@address.com';
			let password = 'thisIsAValidPassword';
			
			return localLoginValidator.create(username, password).then(
				
				(providerAndProviderId: {provider: string, providerId: string}) => {
					providerAndProviderId
						.should.have.property('provider')
						.and.eq('local');
					
					providerAndProviderId
						.should.have.property('providerId')
						.and.have.length.gte(64);
				},
				(error: BlError) => {
					error.should.not.be.fulfilled;
				});
		});
	});
});