import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError} from '@wizardcoder/bl-model';
import {PriceService} from "./price.service";

chai.use(chaiAsPromised);

describe('PriceService', () => {
	describe('sanitize()', () => {
		context('when rounding down to nearest 10', () => {
			const priceService = new PriceService({roundDown: true});
			
			it('should return 30 when given 33', () => {
				return expect(priceService.sanitize(33))
					.to.eql(30);
			});
			
			it('should return 20 when given 28.4', () => {
				return expect(priceService.sanitize(28.4))
					.to.eql(20);
			});
		});

		context('when rounding up to nearest 10', () => {
			const priceService = new PriceService({roundUp: true});

			it('should return 40 when given 33', () => {
				return expect(priceService.sanitize(33))
					.to.eql(40);
			});

			it('should return 30 when given 28.4', () => {
				return expect(priceService.sanitize(28.4))
					.to.eql(30);
			});
		});
	});
	
});