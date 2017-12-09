

import {SeCrypto} from "../../../crypto/se.crypto";
import {BlError} from "../../../bl-error/bl-error";

export class LocalLoginPasswordValidator {
	
	constructor(private seCrypto: SeCrypto) {
	
	}
	
	public validate(password: string, salt: string, hashedPassword: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('LocalLoginPasswordValidator').methodName('validate');
			
			if (!password || password.length <= 0) reject(blError.msg('password is empty or undefined'));
			if (!salt || salt.length <= 0) reject(blError.msg('salt is empty or undefined'));
			if (!hashedPassword || hashedPassword.length <= 0) reject(blError.msg("hashedPassword is empty or undefined"));
			
			this.seCrypto.hash(password, salt).then(
				(passwordAndSaltHashed: string) => {
					if (passwordAndSaltHashed === hashedPassword) {
						resolve(true);
					}
					
					reject(blError.msg('password and salt does not hash into the given hashedPassword'));
					
				},
				(error: BlError) => {
					reject(error.add(blError.msg('could not hash the provided password and salt')));
				});
		});
	}
}