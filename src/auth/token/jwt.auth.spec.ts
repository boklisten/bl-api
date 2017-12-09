import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {UserHandler} from "../user/user.handler";
import {User} from "../../config/schema/user/user";
import {Promise} from 'es6-promise';
import {JwtAuth} from "./jwt.auth";
import {SESchema} from "../../config/schema/se.schema";
import {UserSchema} from "../../config/schema/user/user.schema";
import {UserDetailSchema} from "../../config/schema/user/user-detail.schema";
import {BlError} from "../../bl-error/bl-error";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
chai.use(chaiAsPromised);

let testUsername = 'bill@thesite.com';

class UserHandlerMock extends UserHandler {
	
	constructor() {
		super(new EndpointMongodb(new SESchema('', UserSchema)),
			new EndpointMongodb(new SESchema('', UserDetailSchema)));
	}
	
	get(provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let user: User = {
				username: testUsername,
				permission: 'customer',
				login: {
					provider: provider,
					providerId: providerId
				},
				blid: 'abc',
				userDetail: '123',
				valid: true
			};
			resolve(user);
		});
	}
}

describe('JwtAuth', () => {
	let userHandlerMock = new UserHandlerMock();
	let jwtAuth: JwtAuth = new JwtAuth(userHandlerMock);
	let testProvider = '';
	let testProviderId = '';
	let testUserName = '';
	
	describe('getAuthorizationToken()', () => {
		beforeEach(() => {
			testProvider = 'local';
			testProviderId = '124';
			testUserName = testUsername;
		});
		
		describe('should reject with BlError when', () => {
			
			it('provider is empty', () => {
				let provider = '';
				return jwtAuth.getAuthorizationToken(provider, testProviderId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('provider is null', () => {
				let provider = null;
				return jwtAuth.getAuthorizationToken(provider, testProviderId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('providerId is empty', () => {
				let providerId = '';
				return jwtAuth.getAuthorizationToken(testProvider, providerId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('providerId is undefined', () => {
				let providerId = undefined;
				return jwtAuth.getAuthorizationToken(testProvider, providerId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is empty', () => {
				let username = '';
				return jwtAuth.getAuthorizationToken(testProvider, testProviderId, username)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is undefined', () => {
				let username = undefined;
				return jwtAuth.getAuthorizationToken(testProvider, testProviderId, username)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is not an email', () => {
				let username = 'thisisnotanemail';
				return jwtAuth.getAuthorizationToken(testProvider, testProviderId, username)
					.should.be.rejectedWith(BlError);
			});
		});
		
		describe('should resolve with an jwt when', () => {
			it('username is ' + testUsername, () => {
				return jwtAuth.getAuthorizationToken(testProvider, testProviderId, testUsername)
					.should.eventually.be.fulfilled
					.and.be.a('string')
					.and.have.length.gte(30)
			});
		});
	});
});