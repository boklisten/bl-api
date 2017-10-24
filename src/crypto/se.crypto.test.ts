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
		})
	});
});