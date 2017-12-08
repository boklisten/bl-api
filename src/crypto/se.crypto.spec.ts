import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {SeCrypto} from "./se.crypto";

chai.use(chaiAsPromised);
let shuld = chai.should();

describe('SeCrypto', () => {
	let seCrypto: SeCrypto = new SeCrypto();

	describe('cipher()', () => {

		it('should reject when message is empty', () => {
			return seCrypto.cipher('').should.be.rejected;
		});

		it('should return chipher when msg is valid', () => {
			return seCrypto.cipher('hello').should.be.fulfilled;
		});
	});
	
	describe('hash()', () => {
		let testMsg = '';
		let testSalt = '';
		
		beforeEach(() => {
			testMsg = 'hello';
			testSalt = 'dog';
		});
		
		describe('should reject with TypeError when', () => {
			
			it('msg is empty', () => {
				testMsg = '';
				return seCrypto.hash(testMsg, testSalt)
					.should.be.rejectedWith(TypeError);
			});
			
			it('salt is empty', () => {
				testSalt = '';
				return seCrypto.hash(testMsg, testSalt)
					.should.be.rejectedWith(TypeError);
			});
		});
		
		it('should return hash when salt and password is provided', () => {
			return seCrypto.hash(testMsg, testSalt)
				.should.eventually.be.fulfilled;
		});
		
		it('should not return the same hash if different salt', () => {
			return new Promise((resolve, reject) => {
				seCrypto.hash(testMsg, "dog").then(
					(hashedPassword: string) => {
						seCrypto.hash(testMsg, "dot").then(
							(anotherHashedPassword) => {
								if (anotherHashedPassword !== hashedPassword) resolve(true);
								reject(true);
							},
							(error: any) => {
								reject(error);
							});
					},
					(error: any) => {
						reject(error);
					});
			}).should.eventually.be.fulfilled;
		});
	});
	
});