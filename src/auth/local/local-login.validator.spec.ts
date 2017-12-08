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
import {HashedPasswordGenerator} from "./password/hashed-password-generator";
import {SaltGenerator} from "./salt/salt-generator";
import {LocalLoginCreator} from "./local-login-creator/local-login-creator";
import {ProviderIdGenerator} from "./provider-id/provider-id-generator";
import {BlapiErrorResponse} from "bl-model";

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
			reject(new BlapiErrorResponse(404));
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
	let saltGenerator = new SaltGenerator();
	let seCrypto = new SeCrypto();
	let hashedPasswordGenerator = new HashedPasswordGenerator(saltGenerator, seCrypto);
	let providerIdGenerator = new ProviderIdGenerator(seCrypto);
	let localLoginCreator = new LocalLoginCreator(hashedPasswordGenerator, providerIdGenerator);
	let localLoginValidator = new LocalLoginValidator(localLoginHandler, localLoginPasswordValidatorMock, localLoginCreator);
	
	describe('validateOrCreate()', () => {
		let testUserName = '';
		let testPassword = '';
		
		beforeEach(() => {
			testUserName = "albert@protonmail.com";
			testPassword = 'hello';
		});
		
		describe('should reject with TypeError when', () => {
			it('username is not an email', () => {
				testUserName = 'bill';
				return localLoginValidator.validateOrCreate(testUserName, testPassword)
					.should.be.rejectedWith(TypeError);
			});
			
			it('password is empty', () => {
				testPassword = '';
				return localLoginValidator.validateOrCreate(testUserName, testPassword)
					.should.be.rejectedWith(TypeError);
			});
		});
		
		
		it('should resolve with correct provider and providerId when username and password is correct', () => {
			let expectedProvider = {provider: testLocalLogin.provider, providerId: testLocalLogin.providerId};
			return new Promise((resolve, reject) => {
				localLoginValidator.validateOrCreate(testUserName, testPassword).then(
					(returnedProvider: {provider: string, providerId: string}) => {
						if (returnedProvider.providerId === expectedProvider.providerId) resolve(true);
						reject(new Error('provider is not equal to expectedProvider'));
					},
					(error: any) => {
						reject(error);
					});
			}).should.eventually.be.true;
		});
		
		it('should resolve with correct provider and providerId when username does not exists', () => {
			let username = 'bill@gmail.com';
			let password = 'thisIsAValidPassword';
			return localLoginValidator.validateOrCreate(username, password).then(
				(providerAndProviderId: {provider: string, providerId: string}) => {
					providerAndProviderId
						.should.have.property('provider')
						.and.be.eq('local');
					
					providerAndProviderId
						.should.have.property('providerId')
						.and.have.length.gte(64)
						.and.be.a('string');
				},
				(error: any) => {
					error.should.not.be.fulfilled;
				}
			).should.eventually.be.fulfilled;
		});
	});
});