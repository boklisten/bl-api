import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {RefreshTokenCreator} from "./refresh-token.creator";
import {BlError} from "../../../bl-error/bl-error";

chai.use(chaiAsPromised);

describe('RefreshTokenCreator', () => {
	let refreshTokenCreator = new RefreshTokenCreator();
	describe('', () => {
		
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
				refreshTokenCreator.create(username, testUserid)
					.catch((blError: BlError) => {
						blError.getCode().should.be.eq(103);
						done();
					})
			});
			
			it('userid is null', (done) => {
				let userid = null;
				refreshTokenCreator.create(testUserid, userid)
					.catch((blError: BlError) => {
						blError.getCode().should.be.eq(103);
						done();
					})
			});
		});
		
		describe('should resolve with a RefreshToken when', () => {
			it('username is bill@meathome.se and userid is valid', (done) => {
				let username = 'bill@meathome.se';
				refreshTokenCreator.create(username, testUserid)
					.then((refreshToken) => {
						refreshToken.should.be.a('string')
							.and.have.length.gte(50);
							done();
					});
			});
		});
		
	});
});