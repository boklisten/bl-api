import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {AccessTokenValidator} from "./access-token.validator";
import {BlError} from "../../../bl-error/bl-error";
import {UserPermission} from "../../user/user-permission";
import {RefreshTokenCreator} from "../refresh/refresh-token.creator";
import {AccessTokenCreator} from "./access-token.creator";
import {Promise} from 'es6-promise';

chai.use(chaiAsPromised);

describe('', () => {
	
	let accessTokenValidator = new AccessTokenValidator();
	let refreshTokenCreator = new RefreshTokenCreator();
	let accessTokenCreator = new AccessTokenCreator();
	
	describe('validateAccessToken()', () => {
		context('when accessToken is empty or undefined', () => {
			it('should reject with BlError', () => {
				return accessTokenValidator.validate('')
					.should.be.rejectedWith(BlError);
			});
		});
		
		context('when accessToken is not valid', () => {
			it('should reject with BlError code 905', (done) => {
				accessTokenValidator.validate('this is not valid').then(
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
					refreshTokenCreator.createRefreshToken(username, userid).then(
						(refreshToken: string) => {
							accessTokenCreator.create(username, userid, permission, refreshToken).then(
								(accessToken: string) => {
									accessTokenValidator.validate(accessToken).then(
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