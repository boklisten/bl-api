

import {SaltGenerator} from "../salt/salt-generator";
import {BlError} from "../../../bl-error/bl-error";
import {SeCrypto} from "../../../crypto/se.crypto";

export class HashedPasswordGenerator {
	
	constructor(private saltGenerator: SaltGenerator, private seCrypto: SeCrypto) {
	
	}
	
	public generate(password): Promise<{hashedPassword: string, salt: string}> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('HashedPasswordGenerator').methodName('generate');
			if (!password || password.length < 6) reject(blError.msg('password is empty or to short'));
			
			this.saltGenerator.generate().then(
				(generatedSalt: string) => {
					this.seCrypto.hash(password, generatedSalt).then(
						(hash: string) => {
							resolve({hashedPassword: hash, salt: generatedSalt});
						},
						(error: BlError) => {
							reject(error.add(blError.msg('could not hash the provided password and salt').store('salt', generatedSalt)));
						});
				},
				(error: BlError) => {
					reject(error.add(blError.msg('could not generate salt')));
				});
		});
	}
	
	
}