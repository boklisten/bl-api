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
			
			reject('');
		});
	}
}


describe('LocalLoginValidator', () => {
	let localLoginEndpointMongoDb = new EndpointMongodb(new SESchema('localLogins', LocalLoginSchema));
	let localLoginHandler = new LocalLoginHandlerMock(localLoginEndpointMongoDb);
	let localLoginValidator = new LocalLoginValidator(localLoginHandler);
	
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
		
		/*
		
		it('should resolve with correct provider and providerId when username and password is correct', () => {
			return localLoginValidator.validate(testUserName, testPassword)
				.should.eventually.be.eq({provider: testLocalLogin.provider, providerId: testLocalLogin.providerId});
		});
		
		*/
		
	});
});