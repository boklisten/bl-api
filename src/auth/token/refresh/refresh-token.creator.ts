

import {BlError} from "../../../bl-error/bl-error";
import isEmail = require("validator/lib/isEmail");
import {RefreshTokenSecret} from "./refresh-token.secret";

export class RefreshTokenCreator {
	private jwt = require('jsonwebtoken');
	private refreshTokenSecret: RefreshTokenSecret;
	
	constructor() {
		this.refreshTokenSecret = new RefreshTokenSecret();
	}
	
	public createRefreshToken(username: string, userid: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('')
				.className('TokenHandler')
				.methodName('createRefreshToken')
				.store('username', username)
				.store('userid', userid);
			
			if (!username || !isEmail(username)) return reject(blError.msg('username is undefined or not an email').code(103));
			if (!userid || userid.length <= 0) return reject(blError.msg('userid is empty or undefined').code(103));
			
			this.jwt.sign(this.createRefreshTokenPayload(username, userid), this.refreshTokenSecret.get(),
				(error: any, refreshToken: string) => {
					if (error) return reject(blError.msg('could not create refreshToken').code(906));
					resolve(refreshToken);
				});
		});
	}
	
	private createRefreshTokenPayload(username: string, userid: string) {
		return {
			iss: '',
			aut: '',
			iat: Date.now(),
			exp: Date.now() + 16000,
			username: username,
			userid: userid
		}
	}
}