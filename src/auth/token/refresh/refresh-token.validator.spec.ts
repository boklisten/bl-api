import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {RefreshTokenValidator} from "./refresh-token.validator";
import {BlError} from "../../../bl-error/bl-error";
import {RefreshTokenCreator} from "./refresh-token.creator";

chai.use(chaiAsPromised);

describe('RefreshTokenValidator', () => {
	let refreshTokenValidator = new RefreshTokenValidator();
	let refreshTokenCreator = new RefreshTokenCreator();
	describe('', () => {
	
	});
	
	describe('validateRefreshToken()', () => {
		it('should reject with BlError when refreshToken is empty', () => {
			let refreshToken = '';
			return refreshTokenValidator.validateRefreshToken(refreshToken)
				.should.be.rejectedWith(BlError);
		});
		
		it('should reject with BlError when refreshToken is not valid', (done) => {
			let refreshToken = 'this is not a valid token';
			refreshTokenValidator.validateRefreshToken(refreshToken).then(
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
			refreshTokenCreator.createRefreshToken(username, userid).then(
				(refreshToken: string) => {
					refreshTokenValidator.validateRefreshToken(refreshToken).then(
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