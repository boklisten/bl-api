import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {OrderHook} from "./order.hook";

chai.use(chaiAsPromised);

describe('OrderHook', () => {
	
	const orderHook = new OrderHook();
	
	describe('#run()', () => {
		
		context('no documents provided', () => {
			it('should reject with BlError', () => {
			
			});
		});
	});
});