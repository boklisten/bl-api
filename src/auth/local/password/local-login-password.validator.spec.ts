import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {LocalLoginPasswordValidator} from "./local-login-password.validator";
import {SeCrypto} from "../../../crypto/se.crypto";
import {Promise} from 'es6-promise';
import {BlError} from "@wizardcoder/bl-model";

chai.use(chaiAsPromised);

class SeCryptoMock extends SeCrypto {
	
	hash(password: string, salt: string): Promise<string> {
		return new Promise((resolve, reject) => {
			resolve(password + salt);
		});
	}

}

describe('LocalLoginPasswordValidator', () => {
	let seCryptoMock = new SeCryptoMock();
	let localLoginPasswordValidator = new LocalLoginPasswordValidator(seCryptoMock);
	
	describe('validate', () => {
		let testPassword = '';
		let testSalt = '';
		let testHashedPassword = '';
		
		beforeEach(() => {
			testPassword = 'dog';
			testSalt = 'salt';
			testHashedPassword = testPassword + testSalt;
		});
		
		describe('should reject with BlError when', () => {
			it('password is empty', () => {
				testPassword = '';
				
					return localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword)
						.should.be.rejectedWith(BlError);
			});
			
			it('salt is empty', () => {
				testSalt = '';
				return localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword)
						.should.be.rejectedWith(BlError);
			});
			
			it('hashedPassword is empty', () => {
				testHashedPassword = '';
				return localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword)
					.should.be.rejectedWith(BlError);
			});
		});
		
		it('should reject with Error when password is not correct', () => {
			testPassword = 'human';
			return localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword)
				.should.be.rejectedWith(BlError);
		});
		
		it('should resolve with true when password is correct', () => {
			return localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword)
				.should.eventually.be.true;
		});
	});
});