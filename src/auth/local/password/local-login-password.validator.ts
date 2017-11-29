

import {SeCrypto} from "../../../crypto/se.crypto";

export class LocalLoginPasswordValidator {
	
	constructor(private blCrypto: SeCrypto) {
	
	}
	
	public validate(password: string, salt: string, hashedPassword: string): boolean {
		if (!password || password.length <= 0) throw new TypeError('password is empty or undefined');
		if (!salt || salt.length <= 0) throw new TypeError('salt is empty or undefined');
		if (!hashedPassword || hashedPassword.length <= 0) throw new TypeError("hashedPassword is empty or undefined");
		
		
		
		return true;
	}
}