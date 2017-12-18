import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {AccessTokenCreator} from "./access-token.creator";
import {UserPermission} from "../../user/user-permission";
import {BlError} from "../../../bl-error/bl-error";
import {RefreshTokenCreator} from "../refresh/refresh-token.creator";

chai.use(chaiAsPromised);

describe('AccessTokenCreator', () => {
	let accessTokenCreator = new AccessTokenCreator();
	let refreshTokenCreator = new RefreshTokenCreator();
	
	describe('createAccessToken()', () => {
		let testUsername = '';
		let testUserid = '';
		let testPermission: UserPermission = 'customer';
		let testRefreshToken = '';
		
		beforeEach((done) => {
			testUsername = 'bill@clintonisapedo.com';
			testUserid = '124';
			testPermission = 'customer';
			refreshTokenCreator.createRefreshToken(testUsername, testUserid).then(
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
				return accessTokenCreator.create(username, testUserid, testPermission, testRefreshToken)
					.should.be.rejectedWith(BlError);
			});
			
			it('should reject with BlError when username is empty', () => {
				let username = '';
				return accessTokenCreator.create(username, testUserid, testPermission, testRefreshToken)
					.should.be.rejectedWith(BlError);
			});
			
			it('should reject with BlError when userId is undefined', () => {
				let userid = undefined;
				return accessTokenCreator.create(testUsername, userid, testPermission, testRefreshToken)
					.should.be.rejectedWith(BlError);
			});
			
			it('should should reject with BlError when requestToken is undefined', () => {
				let refreshToken = '';
				return accessTokenCreator.create(testUsername, testUserid, testPermission, refreshToken)
					.should.be.rejectedWith(BlError);
			});
		});
		
		context('when refreshToken is not valid', () => {
			it('should reject with BlError code 905', (done) => {
				let refreshToken = 'this is not valid';
				accessTokenCreator.create(testUsername, testUserid, testPermission, refreshToken).then(
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
				accessTokenCreator.create(testUsername, testUserid, testPermission, testRefreshToken).then(
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
});