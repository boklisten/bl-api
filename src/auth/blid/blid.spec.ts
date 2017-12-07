import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {Blid} from "./blid";

chai.use(chaiAsPromised);

describe('Blid', () => {

	describe('createUserBlid()', () => {
		let blid: Blid = new Blid();

		it('should reject with a TypeError when provider or providerId is empty', () => {
			return blid.createUserBlid('', '').should.be.rejectedWith(Error);
		});

		it('should return a ciphered version', () => {
			return blid.createUserBlid('local', '10102')
				.should.eventually.include('u#');
		});
	});
});