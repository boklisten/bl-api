import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {RefreshTokenValidator} from "./refresh-token.validator";
import {BlError} from "@wizardcoder/bl-model";
import {RefreshTokenCreator} from "./refresh-token.creator";
import {RefreshToken} from "./refresh-token";
import {TokenConfig} from "../token.config";
import {AccessToken} from "../access-token/access-token";

chai.use(chaiAsPromised);

describe('RefreshTokenValidator', () => {
	let refreshTokenConfig: RefreshToken = {
		iss: '',
		aud: '',
		expiresIn: "12h",
		iat: 0,
		sub: '',
		username: ''
	};
	
	let accessTokenConfig: AccessToken = {
		iss: '',
		aud: '',
		expiresIn: "30s",
		iat: 0,
		sub: '',
		username: '',
		permission: 'customer',
		details: ''
	};
	
	let tokenConfig = new TokenConfig(accessTokenConfig, refreshTokenConfig);
	let refreshTokenCreator = new RefreshTokenCreator(tokenConfig);
	
	let refreshTokenValidator = new RefreshTokenValidator();
	
	describe('validateRefreshToken()', () => {
		it('should reject with BlError when refreshToken is empty', () => {
			let refreshToken = '';
			return refreshTokenValidator.validate(refreshToken)
				.should.be.rejectedWith(BlError);
		});
		
		it('should reject with BlError when refreshToken is not valid', (done) => {
			let refreshToken = 'this is not a valid token';
			refreshTokenValidator.validate(refreshToken).then(
				(valid: boolean) => {
					valid.should.not.be.fulfilled;
					done();
				},
				(error: BlError) => {
					error.getCode().should.be.eq(909);
					done();
				});
		});
		
		context('when refreshToken is expired', () => {
			it('should reject with BlCode 909', (done) => {
				let jwt = require('jsonwebtoken');
				
				jwt.sign({username: 'test',
						iat: Math.floor(Date.now()/1000) - 10000},
					'test',
					{ expiresIn: '1s'},
					(error, refreshToken) => {
						refreshTokenValidator.validate(refreshToken).catch(
							(rtokenError: BlError) => {
								rtokenError.getCode().should.be.eql(909);
								done();
							});
					});
			});
		});
		
		context('when refreshToken is valid', () => {
			it('should resolve with payload', (done) => {
				let username = 'bill@hicks.com';
				let userid = 'abc';
				
				refreshTokenCreator.create(username, userid).then(
					(refreshToken: string) => {
						refreshTokenValidator.validate(refreshToken).then(
							(refreshToken: RefreshToken) => {
								refreshToken.aud.should.be.eq(tokenConfig.refreshToken.aud);
								refreshToken.iss.should.be.eq(tokenConfig.refreshToken.iss);
								
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
});