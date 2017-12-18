

import {BlError} from "../../../bl-error/bl-error";
import {RefreshTokenSecret} from "./refresh-token.secret";

export class RefreshTokenValidator {
	private jwt = require('jsonwebtoken');
	private refreshTokenSecret: RefreshTokenSecret;
	
	constructor() {
		this.refreshTokenSecret = new RefreshTokenSecret();
	}
	
	public validate(refreshToken: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!refreshToken || refreshToken.length <= 0) reject(new BlError('refreshToken is empty or undefined').className('TokenHandler').methodName('validateRefreshToken'));
			
			try {
				this.jwt.verify(refreshToken, this.refreshTokenSecret.get(), (error: any, decoded: any) => {
					if (error) return reject(new BlError('could not validate token').className('TokenHandler').className('TokenHandler').methodName('validateRefreshToken').code(905));
					resolve(true);
				});
			} catch (error) {
				reject(new BlError('could not validate token')
					.className('TokenHandler')
					.methodName('validateRefreshToken')
					.store('jwt error', error)
					.code(905));
			}
		});
	}
}