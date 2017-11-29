

import {SeCrypto} from "../../../crypto/se.crypto";

export class LocalLoginPasswordValidator {
	
	constructor(private seCrypto: SeCrypto) {
	
	}
	
	public validate(password: string, salt: string, hashedPassword: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			
			if (!password || password.length <= 0) reject(new TypeError('password is empty or undefined'));
			if (!salt || salt.length <= 0) reject(new TypeError('salt is empty or undefined'));
			if (!hashedPassword || hashedPassword.length <= 0) reject(new TypeError("hashedPassword is empty or undefined"));
			
			this.seCrypto.hash(password, salt).then(
				(passwordAndSaltHashed: string) => {
					if (passwordAndSaltHashed === hashedPassword) {
						resolve(true);
					}
					
					reject(new Error('password and salt does not hash into the given hashedPassword'));
					
				},
				(error: any) => {
					reject(error);
				});
		});
	}
}