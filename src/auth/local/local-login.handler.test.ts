import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

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
import {BlapiErrorResponse} from "bl-model";
import {SEDbQuery} from "../../query/se.db-query";

chai.use(chaiAsPromised);

const dummyLocalLogin = {
	username: "albert@protonmail.com",
	provider: "local",
	providerId: "123",
	hashedPassword: "abc",
	salt: "car"
};

class LocalLoginMongoHandlerMock extends EndpointMongodb {
	
	constructor(schema: SESchema) {
		super(schema);
	}

	post(document: SEDocument): Promise<SEDocument[]> {
		if (document.documentName === 'localLogins') return Promise.resolve([new SEDocument(document.documentName,document.data)]);
		return Promise.reject('there is a error run amock');
	}
	
	get(dbQuery: SEDbQuery): Promise<SEDocument[]> {
		
		for (let filter of dbQuery.stringFilters) {
			if (filter.fieldName === "username" && filter.value === dummyLocalLogin.username) {
				return Promise.resolve([new SEDocument('localLogins', dummyLocalLogin)]);
			}
		}
	
		return Promise.reject(new BlapiErrorResponse(404));
	}
}

describe('LocalLoginHandler', () => {
	
	let localLoginSchema = new SESchema('localLogins', LocalLoginSchema);
	let localLoginMongoHandlerMock = new LocalLoginMongoHandlerMock(localLoginSchema);
	let userSchema = new SESchema('users', UserSchema);
	let userDetailSchema = new SESchema('userDetails', UserDetailSchema);
	let userHandler: UserHandler = new UserHandler(userSchema, userDetailSchema);
	let localLoginHandler = new LocalLoginHandler(localLoginSchema, userHandler, localLoginMongoHandlerMock);
	
	describe('add()', () => {
		let baseLocalLogin = {username: 'a', providerId: '1', hashedPassword: 'b', provider: 'c', salt: 'h'};
		let testLocalLogin: LocalLogin = baseLocalLogin;
		
		beforeEach((done) => {
			testLocalLogin = {username: 'albert@gmail.com', provider: 'local', providerId: 'i', hashedPassword: 'abc', salt: 'l'};
			done();
		});
		
		describe('should reject with TypeError when', () => {
			
			
			it('username is empty or undefined', () => {
				testLocalLogin.username = '';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('provider is empty or undefiend', () => {
				testLocalLogin.provider = '';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('providerId is empty or undefined', () => {
				testLocalLogin.providerId = '';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('hashedPassword is empty or undefined', () => {
				testLocalLogin.hashedPassword = '';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('salt is empty or undefined', () => {
				testLocalLogin.salt = '';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
		});
		
		describe('should reject with TypeError when', () => {
			
			it('username is "alb@"', () => {
				testLocalLogin.username = 'alb@';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('username is "bill@mail."', () => {
				testLocalLogin.username = 'bill@mail.';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
			
			it('username is "alli @mail.com"', () => {
				testLocalLogin.username = 'alli @mail.com';
				return localLoginHandler.add(testLocalLogin).should.be.rejectedWith(TypeError);
			});
		});
		
		
		
		it('should resolve when LocalLogin is valid', () => {
			return localLoginHandler.add(testLocalLogin).should.eventually.eq(testLocalLogin);
		});
		
	});
	
	describe('get()', () => {
		let testUsername = "";
		
		beforeEach((done) => {
			testUsername = "albert@protonmail.com";
			done();
		});
		
		
		describe('should reject with TypeError when', () => {
			
			it('username is not a valid Email', () => {
				testUsername = "al";
				return localLoginHandler.get(testUsername).should.be.rejectedWith(TypeError);
			});
			
			it('username is not empty', () => {
				testUsername = "";
				return localLoginHandler.get(testUsername).should.be.rejectedWith(TypeError);
			});
			
			it('username is null', () => {
				testUsername = null;
				return localLoginHandler.get(testUsername).should.be.rejectedWith(TypeError);
			});
			
		});
		
		it('should reject with BlapiErrorResponse.code 404 when username is not found in db', () => {
			testUsername = 'bill@mail.com';
			return expect(localLoginHandler.get(testUsername))
				.to.be.rejected
				.then((error) => {
					expect(error)
						.to.be.instanceof(BlapiErrorResponse)
						.and.to.have.property('code', 404)
				});
		});
		
		it('should resolve with LocalLogin object when username is found', () => {
			return localLoginHandler.get(testUsername)
				.should.eventually.eq(dummyLocalLogin);
		});
		
		
	});
});


