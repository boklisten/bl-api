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
chai.use(chaiAsPromised);

class UserHandlerMock extends UserHandler {
	
	constructor() {
		super(new SESchema('', UserSchema), new SESchema('', UserDetailSchema));
	}
	
	getOrCreateUser(provider: string, providerId: string, username: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let user: User = {
				username: username,
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
			testUserName = 'bill@thesite.com';
		});
		
		describe('should reject with BlError when', () => {
			
			it('provider is empty', () => {
				let provider = '';
				return jwtAuth.getAutorizationToken(provider, testProviderId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('provider is null', () => {
				let provider = null;
				return jwtAuth.getAutorizationToken(provider, testProviderId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('providerId is empty', () => {
				let providerId = '';
				return jwtAuth.getAutorizationToken(testProvider, providerId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('providerId is undefined', () => {
				let providerId = undefined;
				return jwtAuth.getAutorizationToken(testProvider, providerId, testUserName)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is empty', () => {
				let username = '';
				return jwtAuth.getAutorizationToken(testProvider, testProviderId, username)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is undefined', () => {
				let username = undefined;
				return jwtAuth.getAutorizationToken(testProvider, testProviderId, username)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is not an email', () => {
				let username = 'thisisnotanemail';
				return jwtAuth.getAutorizationToken(testProvider, testProviderId, username)
					.should.be.rejectedWith(BlError);
			});
		});
		
		describe('should resolve with an jwt when', () => {
			it('username is "bill@gmail.com"', () => {
				let username = 'bill@gmail.com';
				return jwtAuth.getAutorizationToken(testProvider, testProviderId, username)
					.should.eventually.be.fulfilled
					.and.be.a('string')
					.and.have.length.gte(30)
			});
			
			it('username is "hello@kitty.com"', () => {
				let username = 'hello@kitty.com';
				return jwtAuth.getAutorizationToken(testProvider, testProviderId, username)
					.should.eventually.be.fulfilled
					.and.be.a('string')
					.and.have.length.gte(30)
			});
			
		});
	});
});