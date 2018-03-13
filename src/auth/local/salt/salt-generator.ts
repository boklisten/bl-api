

import {BlError} from "bl-model";
const crypto = require('crypto');

export class SaltGenerator {
	
	constructor() {
	
	}
	
	public generate(): Promise<string> {
		return new Promise((resolve, reject) => {
			crypto.randomBytes(256, (error, buffer) => {
				if (error) reject(
					new BlError('could not create random bytes')
						.data(error)
						.className('SaltGenerator')
						.methodName('generate'));
				
				resolve(buffer.toString('hex'));
			});
		});
	}
	
}