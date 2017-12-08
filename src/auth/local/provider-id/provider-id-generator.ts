

import {BlError} from "../../../bl-error/bl-error";
import {SeCrypto} from "../../../crypto/se.crypto";
const crypto = require('crypto');

export class ProviderIdGenerator {
	
	constructor(private seCrypto: SeCrypto) {
	
	}
	
	generate(username: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!username || username.length <= 0) reject(new BlError('username is empty or undefined'));
			
			crypto.randomBytes(32, (error, buffer) => {
				if (error) reject(new BlError('could not generate random bytes'));
				
				this.seCrypto.hash(username, buffer.toString('hex')).then(
					(hashedMsg: string) => {
						resolve(hashedMsg);
					},
					(error: any) => {
						reject(new BlError('could not hash the provided username and salt'));
					});
			})
		});
	}
}