

import {BlError} from "../../../bl-error/bl-error";
import {AccessTokenSecret} from "./access-token.secret";

export class AccessTokenValidator {
	private accessTokenSecret: AccessTokenSecret;
	private jwt = require('jsonwebtoken');
	
	constructor() {
		this.accessTokenSecret = new AccessTokenSecret();
	}
	
	public validate(accessToken: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!accessToken) reject(new BlError('accessToken is empty or undefined'));
			
			try {
				this.jwt.verify(accessToken, this.accessTokenSecret.get(), (error, decoded) => {
					if (error) return reject(new BlError('could not verify jwt').store('accessToken', accessToken).code(905));
				});
				resolve(true);
			} catch (error) {
				
				return reject(new BlError('could not verify accessToken')
					.code(905));
			}
		});
	}
	
}