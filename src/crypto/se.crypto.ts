

const crypto = require('crypto');

export class SeCrypto {

	constructor() {

	}

	public cipher(msg: string): Promise<string> {
		return new Promise((resolve, reject) => {

			if (msg.length <= 0) reject('msg to short');

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
			if (!msg || msg.length <= 0) return reject(new TypeError('msg is empty or undefined'));
			if (!salt || salt.length <= 0) return reject(new TypeError('salt is empty or undefined'));
			
			const cryptoHash = crypto.createHash('sha256');
			
			cryptoHash.on('readable', () => {
				const data = cryptoHash.read();
				if (data) {
					let hashedPassword = data.toString('hex');
					return resolve(hashedPassword);
				}
				return reject(new Error('could not hash the provided message'));
			});
			
			cryptoHash.write(msg + salt);
			
			cryptoHash.end();
		});
	}
}
