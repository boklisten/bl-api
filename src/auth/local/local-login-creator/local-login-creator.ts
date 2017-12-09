

import {LocalLogin} from "../../../config/schema/login-local/local-login";
import isEmail = require("validator/lib/isEmail");
import {BlError} from "../../../bl-error/bl-error";
import {HashedPasswordGenerator} from "../password/hashed-password-generator";
import {ProviderIdGenerator} from "../provider-id/provider-id-generator";

export class LocalLoginCreator {
	constructor(private hashedPasswordGenerator: HashedPasswordGenerator, private providerIdGenerator: ProviderIdGenerator) {
	
	}
	
	public create(username: string, password: string): Promise<LocalLogin> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('LocalLoginCreator').methodName('create');
			if (!username || !isEmail(username)) return reject(blError.msg('username "'+ username + '"is undefined or is not an Email'));
			if (!password || password.length < 6) return reject(blError.msg('password is to short or empty'));
			
			this.hashedPasswordGenerator.generate(password).then(
				(hashedPasswordAndSalt: {hashedPassword: string, salt: string}) => {
					this.providerIdGenerator.generate(username).then(
						(providerId: string) => {
							let newLocalLogin = new LocalLogin();
							newLocalLogin.username = username;
							newLocalLogin.hashedPassword = hashedPasswordAndSalt.hashedPassword;
							newLocalLogin.salt = hashedPasswordAndSalt.salt;
							newLocalLogin.provider = 'local';
							newLocalLogin.providerId = providerId;
							
							resolve(newLocalLogin);
						},
						(error: BlError) => {
							reject(error.add(blError.msg('could not create providerId')));
						});
				},
				(error: BlError) => {
					reject(error.add(blError.msg('could not create hashedPassword and salt')));
				});
		});
	}
}