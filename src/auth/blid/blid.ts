
import {SeCrypto} from "../../crypto/se.crypto";

export class Blid {
	private seCrypto: SeCrypto;

	constructor() {

		this.seCrypto = new SeCrypto();

	}

	public createUserBlid(provider: string, providerId: string): Promise<string> {
		if (provider.length <= 0 || providerId.length <= 0) return Promise.reject(new TypeError('provider or providerId can not be empty'));

		return new Promise((resolve, reject) => {
			this.seCrypto.cipher(provider + providerId).then(
				(cipher: string) => {
					resolve('u#' + cipher);
				},
				(error: any) => {
					reject('error creating cipher for user_blid, reason ' + error);
				}
			);
		});
	}
}