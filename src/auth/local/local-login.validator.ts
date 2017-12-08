

import {LocalLoginHandler} from "./local-login.handler";
import {isEmail} from "validator";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {BlapiErrorResponse} from "bl-model";
import {LocalLoginPasswordValidator} from "./password/local-login-password.validator";
import {BlError} from "../../bl-error/bl-error";
import {HashedPasswordGenerator} from "./password/hashed-password-generator";
import {LocalLoginCreator} from "./local-login-creator/local-login-creator";

export class LocalLoginValidator {
	
	constructor(private localLoginHandler: LocalLoginHandler,
				private localLoginPasswordValidator: LocalLoginPasswordValidator,
				private localLoginCreator: LocalLoginCreator) {
	
	}
	
	public validateOrCreate(username: string, password: string): Promise<{provider: string, providerId: string}> {
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
					//the username does not exist
					if (error.code === 404) {
						
						this.localLoginCreator.create(username, password).then(
							(localLogin: LocalLogin) => {
								this.localLoginHandler.add(localLogin).then(
									(addedLocalLogin: LocalLogin) => {
										resolve({provider: addedLocalLogin.provider, providerId: addedLocalLogin.providerId});
									},
									(error: BlapiErrorResponse) => {
										reject(new BlError('could not insert the localLogin object'));
									});
							},
							(error: any) => {
								reject(new BlError('could not create LocalLogin object by the provided username and password'));
							});
					} else {
						reject(new BlError('there was a problem with finding the  user by the username "'+ username +'"', 500));
					}
				});
		});
	}
}