

import {BlError} from "@wizardcoder/bl-model";

const crypto = require('crypto');

export class SeCrypto {

	constructor() {

	}

	public cipher(msg: string): Promise<string> {
		return new Promise((resolve, reject) => {

			if (msg.length <= 0) reject(new BlError('msg to short').className('SeCrypto').methodName('cipher'));

			let msgCipher = crypto.createCipher('aes128', msg);

			let encryptedMsg = '';

			msgCipher.on('readable', () => {
				const data = msgCipher.read();
				if (data) {
					encryptedMsg += data.toString('hex');
				}
			});

			msgCipher.on('end', () => {
				resolve(encryptedMsg);
			});

			msgCipher.end();
		});
	}
	
	public hash(msg: string, salt: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('SeCrypto').methodName('hash');
			
			if (!msg || msg.length <= 0) return reject(blError.msg('msg is empty or undefined'));
			if (!salt || salt.length <= 0) return reject(blError.msg('salt is empty or undefined'));
			
			const cryptoHash = crypto.createHash('sha256');
			
			cryptoHash.on('readable', () => {
				const data = cryptoHash.read();
				if (data) {
					let hashedPassword = data.toString('hex');
					return resolve(hashedPassword);
				}
				return reject(blError.msg('could not hash the provided message'));
			});
			
			cryptoHash.write(msg + salt);
			
			cryptoHash.end();
		});
	}
}
