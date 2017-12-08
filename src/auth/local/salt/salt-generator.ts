

import {BlError} from "../../../bl-error/bl-error";
const crypto = require('crypto');

export class SaltGenerator {
	
	constructor() {
	
	}
	
	public generate(): Promise<string> {
		return new Promise((resolve, reject) => {
			crypto.randomBytes(256, (error, buffer) => {
				if (error) reject(new BlError('could not create random bytes'));
				resolve(buffer.toString('hex'));
			});
		});
	}
	
}