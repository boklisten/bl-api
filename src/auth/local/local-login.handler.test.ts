import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';

import {expect} from 'chai';
import {LocalLoginHandler} from "./local-login.handler";
import {SESchema} from "../../config/schema/se.schema";
import {UserHandler} from "../user/user.handler";
import {UserSchema} from "../../config/schema/user/user.schema";
import {UserDetailSchema} from "../../config/schema/user/user-detail.schema";
import {LocalLoginSchema} from "../../config/schema/login-local/local-login.schema";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {SEDocument} from "../../db/model/se.document";

chai.use(chaiAsPromised);
chai.use(sinonChai);


class LocalLoginMongoHandlerMock extends EndpointMongodb {
	
	constructor(schema: SESchema) {
		super(schema);
	}

	post(document: SEDocument): Promise<SEDocument[]> {
		if (document.documentName === 'localLogins') return Promise.resolve([new SEDocument(document.documentName,document.data)]);
		return Promise.reject('there is a error run amock');
	}
}

describe('LocalLoginHandler', () => {
	
	let localLoginSchema = new SESchema('localLogins', LocalLoginSchema);
	let localLoginMongoHandlerMock = new LocalLoginMongoHandlerMock(localLoginSchema);
	let userSchema = new SESchema('users', UserSchema);
	let userDetailSchema = new SESchema('userDetails', UserDetailSchema);
	let userHandler: UserHandler = new UserHandler(userSchema, userDetailSchema);
	let localLoginHandler = new LocalLoginHandler(localLoginSchema, userHandler, localLoginMongoHandlerMock);
	
	describe('insertLocalLogin()', () => {
		let baseLocalLogin = {username: 'a', providerId: '1', hashedPassword: 'b', provider: 'c', salt: 'h'};
		let testLocalLogin: LocalLogin = baseLocalLogin;
		
		beforeEach((done) => {
			testLocalLogin = {username: 'albert@gmail.com', provider: 'local', providerId: 'i', hashedPassword: 'abc', salt: 'l'};
			done();
		});
		
		describe('should reject with TypeError when', () => {
			
			
			it('username is empty or undefined', () => {
				testLocalLogin.username = '';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('provider is empty or undefiend', () => {
				testLocalLogin.provider = '';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('providerId is empty or undefined', () => {
				testLocalLogin.providerId = '';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('hashedPassword is empty or undefined', () => {
				testLocalLogin.hashedPassword = '';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('salt is empty or undefined', () => {
				testLocalLogin.salt = '';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
		});
		
		describe('should reject with TypeError when', () => {
			
			it('username is "alb@"', () => {
				testLocalLogin.username = 'alb@';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('username is "bill@mail."', () => {
				testLocalLogin.username = 'bill@mail.';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('username is "alli @mail.com"', () => {
				testLocalLogin.username = 'alli @mail.com';
				return localLoginHandler.insertLocalLogin(testLocalLogin).should.be.rejectedWith(TypeError);
			});
		});
		
		
		
		it('should resolve when LocalLogin is valid', () => {
			return localLoginHandler.insertLocalLogin(testLocalLogin).should.eventually.eq(testLocalLogin);
		});
		
	});
});