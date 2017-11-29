import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {LocalLoginPasswordValidator} from "./local-login-password.validator";
import {SeCrypto} from "../../../crypto/se.crypto";

chai.use(chaiAsPromised);

class SeCryptoMock extends SeCrypto {

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
			testHashedPassword = 'abc';
		});
		
		describe('should throw TypeError when', () => {
			it('password is empty', () => {
				testPassword = '';
				expect(() => {
					localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword);
				}).to.throw(TypeError);
			});
			
			it('salt is empty', () => {
				testSalt = '';
				expect(() => {
					localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword);
				}).to.throw(TypeError);
			});
			
			it('hashedPassword is empty', () => {
				testHashedPassword = '';
				expect(() => {
					localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword);
				}).to.throw(TypeError);
			});
		});
		/*
		it('should return false if password is not correct', () => {
			return localLoginPasswordValidator.validate(testPassword, testSalt, testHashedPassword)
				.should.eventually.be.false;
		});
		*/
	});
});