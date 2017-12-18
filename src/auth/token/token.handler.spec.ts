import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {RedisHandler} from "../../db/redis/redis.handler";
import {TokenHandler} from "./token.handler";
import {BlError} from "../../bl-error/bl-error";
import {UserPermission} from "../user/user-permission";
import {Promise} from 'es6-promise';

chai.use(chaiAsPromised);

class RedisHandlerMock extends RedisHandler {
	
	constructor() {
		super();
	}

}

describe('TokenHandler', () => {
	let redisHandlerMock = new RedisHandlerMock();
	let tokenHandler = new TokenHandler(redisHandlerMock);
	
	describe('create', () => {
		let testUsername = '';
		let testUserid = '';
		let testPermission = '';
		
		beforeEach(() => {
			testUsername = 'bill@ofrights.com';
			testUserid = 'user1';
			testPermission = 'customer';
		});
		
		describe('should reject with BlError when', () => {
			it('username is empty', () => {
				let username = '';
				return tokenHandler.create(username, testUserid, testPermission)
					.catch((blError) => {
						blError.getCode().should.be.eq(103);
					});
			});
			
			it('username is null', () => {
				let username = null;
				return tokenHandler.create(username, testUserid, testPermission)
					.catch((blError) => {
						blError.getCode().should.be.eq(103);
					});
			});
			
			it('userid is empty', () => {
				let userid = '';
				return tokenHandler.create(testUsername, userid, testPermission)
					.catch((blError) => {
						blError.getCode().should.be.eq(103);
					});
			});
			
			it('permission is undefined', () => {
				let permission = undefined;
				return tokenHandler.create(testUsername, testUserid, permission)
					.catch((blError) => {
						blError.getCode().should.be.eq(103);
					});
			});
		});
	});
	
	
	
	describe('createAccessToken()', () => {
		let testUsername = '';
		let testUserid = '';
		let testPermission: UserPermission = 'customer';
		let testRefreshToken = '';
		
		beforeEach((done) => {
			testUsername = 'bill@clintonisapedo.com';
			testUserid = '124';
			testPermission = 'customer';
			tokenHandler.createRefreshToken(testUsername, testUserid).then(
				(refreshToken: string) => {
					testRefreshToken = refreshToken;
					done();
				},
				(error: BlError) => {
					testRefreshToken = 'this is not valid..';
					done();
				});
		});
		
		context('when parameter is malformed', () => {
			it('should reject with BlError when username is undefined', () => {
				let username = undefined;
				return tokenHandler.createAccessToken(username, testUserid, testPermission, testRefreshToken)
					.should.be.rejectedWith(BlError);
			});
			
			it('should reject with BlError when username is empty', () => {
				let username = '';
				return tokenHandler.createAccessToken(username, testUserid, testPermission, testRefreshToken)
					.should.be.rejectedWith(BlError);
			});
			
			it('should reject with BlError when userId is undefined', () => {
				let userid = undefined;
				return tokenHandler.createAccessToken(testUsername, userid, testPermission, testRefreshToken)
					.should.be.rejectedWith(BlError);
			});
			
			it('should should reject with BlError when requestToken is undefined', () => {
				let refreshToken = '';
				return tokenHandler.createAccessToken(testUsername, testUserid, testPermission, refreshToken)
					.should.be.rejectedWith(BlError);
			});
		});
		
		context('when refreshToken is not valid', () => {
			it('should reject with BlError code 905', (done) => {
				let refreshToken = 'this is not valid';
				tokenHandler.createAccessToken(testUsername, testUserid, testPermission, refreshToken).then(
					(accessToken: string) => {
						accessToken.should.not.be.fulfilled;
						done();
					},
					(error: BlError) => {
						error.getCode().should.be.eq(905);
						done();
					});
			});
		});
		
		context('when all parameters is valid', () => {
			it('should resolve with a accessToken', (done) => {
				tokenHandler.createAccessToken(testUsername, testUserid, testPermission, testRefreshToken).then(
					(accessToken: string) => {
						accessToken.should.be.a('string');
						done();
					},
					(error: BlError) => {
						error.should.not.be.fulfilled;
						done();
					});
			});
		});
	});
	
	describe('validateAccessToken()', () => {
		context('when accessToken is empty or undefined', () => {
			it('should reject with BlError', () => {
				return tokenHandler.validateAccessToken('')
					.should.be.rejectedWith(BlError);
			});
		});
		
		context('when accessToken is not valid', () => {
			it('should reject with BlError code 905', (done) => {
				tokenHandler.validateAccessToken('this is not valid').then(
					(accessToken) => {},
					(error: BlError) => {
						error.getCode().should.be.eq(905);
						done();
					});
			});
		});
		
		context('when accessToken is valid', () => {
			it('should should resolve with true', () => {
				let username = 'bill@anderson.com';
				let userid = '123';
				let permission: UserPermission = 'admin';
				return new Promise((resolve, reject) => {
					tokenHandler.createRefreshToken(username, userid).then(
						(refreshToken: string) => {
							tokenHandler.createAccessToken(username, userid, permission, refreshToken).then(
								(accessToken: string) => {
									tokenHandler.validateAccessToken(accessToken).then(
										(valid: boolean) => {
											resolve(valid);
										},
										(error) => {
											reject(true);
										});
								},
								(error) => {
									reject(true);
								});
						},
						(error) => {
							reject(true);
						});
				}).should.eventually.be.fulfilled;
			});
		});
	});
});