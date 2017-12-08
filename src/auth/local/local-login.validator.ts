

import {LocalLoginHandler} from "./local-login.handler";
import {isEmail} from "validator";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {BlapiErrorResponse} from "bl-model";
import {LocalLoginPasswordValidator} from "./password/local-login-password.validator";
import {BlError} from "../../bl-error/bl-error";
import {HashedPasswordGenerator} from "./password/hashed-password-generator";

export class LocalLoginValidator {
	
	constructor(private localLoginHandler: LocalLoginHandler,
				private localLoginPasswordValidator: LocalLoginPasswordValidator,
				private hashedPasswordGenerator: HashedPasswordGenerator) {
	
	}
	
	public validate(username: string, password: string): Promise<{provider: string, providerId: string}> {
		return new Promise((resolve, reject) => {
			if (!username || !isEmail(username)) return reject(new TypeError('username "' + username + '" is not an email'));
			if (!password || password.length <= 0) return reject(new TypeError('password is empty or undefined'));
			
			this.localLoginHandler.get(username).then(
				(localLogin: LocalLogin) => {
					
					this.localLoginPasswordValidator.validate(password, localLogin.salt, localLogin.hashedPassword).then(
						(validPassword: boolean) => {
							resolve({provider: localLogin.provider, providerId: localLogin.providerId});
						},
						(error: any) => {
							reject(error);
						});
					
				},
				(error: BlapiErrorResponse) => {
					reject(error);
				});
		});
	}
	
	public createNewLocalLogin(username: string, password: string): Promise<{provider: string, providerId: string}> {
		return new Promise((resolve, reject) => {
			if (!username || !isEmail(username)) return reject(new BlError('username "'+ username + '"is undefined or is not an Email'));
			if (!password || password.length < 6) return reject(new BlError('password is to short or empty'));
			
			
		});
	}
}