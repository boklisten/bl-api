

import {LocalLoginHandler} from "./local-login.handler";
import {isEmail} from "validator";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {BlapiErrorResponse} from "bl-model";

export class LocalLoginValidator {
	
	constructor(private localLoginHandler: LocalLoginHandler) {
	
	}
	
	public validate(username: string, password: string): Promise<{provider: string, providerId: string}> {
		return new Promise((resolve, reject) => {
			if (!username || !isEmail(username)) return reject(new TypeError('username "' + username + '" is not an email'));
			if (!password || password.length <= 0) return reject(new TypeError('password is empty or undefined'));
			
			this.localLoginHandler.get(username).then(
				(localLogin: LocalLogin) => {
					console.log('hello there maaan', localLogin);
				},
				(error: BlapiErrorResponse) => {
					reject(error);
				});
		});
	}
}