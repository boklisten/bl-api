

import {LocalLogin} from "../../../collections/local-login/local-login";
import isEmail = require("validator/lib/isEmail");
import {BlError} from "bl-model";
import {HashedPasswordGenerator} from "../password/hashed-password-generator";
import {ProviderIdGenerator} from "../provider-id/provider-id-generator";

export class LocalLoginCreator {
	constructor(private hashedPasswordGenerator: HashedPasswordGenerator, private providerIdGenerator: ProviderIdGenerator) {
	
	}
	
	public create(username: string, password: string): Promise<LocalLogin> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('LocalLoginCreator').methodName('create');
			if (!username || !isEmail(username)) return reject(blError.msg('username "'+ username + '" is undefined or not an Email').code(103));
			if (!password || password.length < 6) return reject(blError.msg('password is to short or empty').code(103));
			
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
						(providerIdGeneratorError: BlError) => {
							reject(blError
								.msg('could not create providerId')
								.add(providerIdGeneratorError));
						});
				},
				(hashedPasswordGeneratorError: BlError) => {
					reject(blError
						.msg('could not create hashedPassword and salt')
						.add(hashedPasswordGeneratorError));
				});
		});
	}
}