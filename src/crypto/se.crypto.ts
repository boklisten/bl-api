

const crypto = require('crypto');

export class SeCrypto {

	constructor() {

	}

	public cipher(msg: string): Promise<string> {
		return new Promise((resolve, reject) => {

			if (msg.length <= 0) reject('msg to short');

			let msgCipher = crypto.createCipher('aes192', msg);


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
}
