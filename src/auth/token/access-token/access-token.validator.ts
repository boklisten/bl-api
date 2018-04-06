

import {BlError} from "@wizardcoder/bl-model";
import {AccessTokenSecret} from "./access-token.secret";
import {AccessToken} from "./access-token";

export class AccessTokenValidator {
	private accessTokenSecret: AccessTokenSecret;
	private jwt = require('jsonwebtoken');
	
	constructor() {
		this.accessTokenSecret = new AccessTokenSecret();
	}
	
	public validate(accessToken: string): Promise<AccessToken> {
		return new Promise((resolve, reject) => {
			if (!accessToken) return reject(new BlError('accessToken is empty or undefined'));
			
			try {
				this.jwt.verify(accessToken, this.accessTokenSecret.get(), (error, payload: AccessToken) => {
					if (error) return reject(new BlError('could not verify jwt')
						.store('accessToken', accessToken)
						.code(910));
					
					resolve(payload);
				});
			} catch (error) {
				return reject(new BlError('could not verify accessToken')
					.code(910));
			}
		});
	}
	
}