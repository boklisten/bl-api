import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {SaltGenerator} from "./salt-generator";

chai.use(chaiAsPromised);

describe('SaltGenerator', () => {
	let saltGenerator = new SaltGenerator();
	
	describe('generate()', () => {
		
		it('should return a random salt', () => {
			return saltGenerator.generate()
				.should.eventually.be.fulfilled;
		});
	});
});