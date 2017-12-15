import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {RedisHandler} from "../../db/redis/redis.handler";
import {TokenHandler} from "./token.handler";
import {BlError} from "../../bl-error/bl-error";

chai.use(chaiAsPromised);

class RedisHandlerMock extends RedisHandler {

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
	
	describe('createRefreshToken()', () => {
		
		let testUsername = '';
		let testUserid = '';
		
		beforeEach(() => {
			testUsername = 'bill@oriley.co';
			testUserid = 'abc1';
		});
		
		describe('should reject with BlError when', () => {
			it('username is undefined', (done) => {
				let username = undefined;
				tokenHandler.createRefreshToken(username, testUserid)
					.catch((blError: BlError) => {
						blError.getCode().should.be.eq(103);
						done();
					})
			});
			
			it('userid is null', (done) => {
				let userid = null;
				tokenHandler.createRefreshToken(testUserid, userid)
					.catch((blError: BlError) => {
						blError.getCode().should.be.eq(103);
						done();
					})
			});
		});
		
		describe('should resolve with a RefreshToken when', () => {
			it('username is bill@meathome.se and userid is valid', (done) => {
				let username = 'bill@meathome.se';
				tokenHandler.createRefreshToken(username, testUserid)
					.then((refreshToken) => {
						refreshToken.should.be.a('string')
							.and.have.length.gte(50);
							done();
					});
			});
		});
		
	});
	describe('validateRefreshToken()', () => {
		it('should reject with BlError when refreshToken is empty', () => {
			let refreshToken = '';
			return tokenHandler.validateRefreshToken(refreshToken)
				.should.be.rejectedWith(BlError);
		});
		
		it('should reject with BlError when refreshToken is not valid', (done) => {
			let refreshToken = 'this is not a valid token';
			tokenHandler.validateRefreshToken(refreshToken).then(
				(valid: boolean) => {
					valid.should.not.be.fulfilled;
					done();
				},
				(error: BlError) => {
					error.getCode().should.be.eq(905);
					done();
				});
		});
		
		it('should resolve with true when refreshToken is valid', (done) => {
			let username = 'bill@hicks.com';
			let userid = 'abc';
			tokenHandler.createRefreshToken(username, userid).then(
				(refreshToken: string) => {
					tokenHandler.validateRefreshToken(refreshToken).then(
						(valid: boolean) => {
							valid.should.be.true;
							done();
						},
						(error) => {
							error.should.not.be.fulfilled;
							done();
						});
				},
				(error) => {
					error.should.not.be.fulfilled;
					done();
				});
		});
		
	});
});