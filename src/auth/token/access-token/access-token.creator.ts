

import {RefreshTokenValidator} from "../refresh/refresh-token.validator";
import {UserPermission} from "../../user/user-permission";
import {BlError} from "../../../bl-error/bl-error";
import {AccessTokenSecret} from "./access-token.secret";

export class AccessTokenCreator {
	
	private refreshTokenValidator: RefreshTokenValidator;
	private accessTokenSecret: AccessTokenSecret;
	private jwt = require('jsonwebtoken');
	
	constructor() {
		this.refreshTokenValidator = new RefreshTokenValidator();
		this.accessTokenSecret = new AccessTokenSecret();
	}
	
	public create(username: string, userid: string, permission: UserPermission, refreshToken: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!username || !userid || !refreshToken) return reject(new BlError('parameter is empty or undefined').className('TokenHandler').methodName('createAccessToken'));
			
			this.refreshTokenValidator.validate(refreshToken).then(
				(valid: boolean) => {
					this.jwt.sign(this.createPayload(username, userid, permission), this.accessTokenSecret.get(), (error: any, accessToken: string) => {
						if (error) return reject(new BlError('could not sign jwt').store('usename', username).store('permission', permission).code(905));
						return resolve(accessToken);
					});
				},
				(refreshTokenError: BlError) => {
					reject(new BlError('refreshToken is not valid')
						.add(refreshTokenError)
						.code(905));
				});
		});
	}
	
	private createPayload(username: string, userid: string, permission: string) {
		return {
			iss: '',
			aut: '',
			iat: Date.now(),
			exp: Date.now() + 100,
			username: username,
			userid: userid,
			permission: permission
		}
	}
}