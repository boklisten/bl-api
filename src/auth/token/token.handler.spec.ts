import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {TokenHandler} from "./token.handler";
import {BlError} from "@wizardcoder/bl-model";
import {Promise} from 'es6-promise';
import {UserHandler} from "../user/user.handler";
import {User} from "../../collections/user/user";
import {TokenConfig} from "./token.config";
import {AccessToken} from "./access-token/access-token";
import {RefreshToken} from "./refresh/refresh-token";

chai.use(chaiAsPromised);

const testUser: User = {
	id: 'abc',
	username: 'bill@clintonisugly.com',
	userDetail: 'abc',
	permission: 'customer',
	login: {
		provider: '',
		providerId: ''
	},
	blid: '123',
	valid: true
};

class UserHandlerMock extends UserHandler {

	getByUsername(username: string): Promise<User> {
		return new Promise((resolve, reject) => {
		    if (username === testUser.username) {
		    	return resolve(testUser);
			}
			reject(new BlError('could not find user'))
		});
	}
}

describe('TokenHandler', () => {
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
	
	let userHandlerMock = new UserHandlerMock();
	let tokenConfig = new TokenConfig(accessTokenConfig, refreshTokenConfig);
	let tokenHandler = new TokenHandler(userHandlerMock, tokenConfig);
	
	describe('createTokens()', () => {
		context('when username is not valid', () => {
			it('should reject with BlError', () => {
				let username = undefined;
				return tokenHandler.createTokens(username)
					.should.be.rejectedWith(BlError);
			});
		});
		
		context('when username is valid', () => {
			it('should resolve with accessToken and refreshToken', (done) => {
				tokenHandler.createTokens(testUser.username).then(
					(tokens: {accessToken: string, refreshToken: string}) => {
						tokens.accessToken.should.have.length.gte(50);
						tokens.refreshToken.should.have.length.gte(50);
						done();
					});
			});
		})
		
	});
	
	
});