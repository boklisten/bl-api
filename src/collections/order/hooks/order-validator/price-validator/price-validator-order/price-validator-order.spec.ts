import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Order} from "bl-model";
import {PriceValidatorOrder} from "./price-validator-order";

chai.use(chaiAsPromised);

describe('PriceValidatorOrder', () => {
	
	describe('#validate()', () => {
		const priceValidatorOrder: PriceValidatorOrder = new PriceValidatorOrder();
		let testOrder: Order;
		
	
		beforeEach(() => {
			testOrder = {
				id: 'o1',
				amount: 200,
				orderItems: [
					{
						type: "buy",
						amount: 100,
						item: 'i1',
						title: 'signatur',
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 100
					},
					{
						type: "rent",
						amount: 100,
						item: 'i1',
						customerItem: 'ci1',
						title: 'signatur',
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 100
					}
				],
				branch: 'b1',
				byCustomer: true,
				delivery: '',
				payments: [],
				comments: [],
				active: true,
				user: {
					id: 'u1'
				},
				lastUpdated: new Date(),
				creationTime: new Date()
			};
		});
		
		context('when orderItems amount is not the same as amount on order', () => {
			it('should throw BlError', () => {
				testOrder.orderItems = [
					{
						type: "rent",
						amount: 100,
						item: 'i1',
						title: 'signatur',
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 100
					},
					{
						type: "rent",
						amount: 100,
						item: 'i2',
						title: 'signatur 2',
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 100
					}
				];
				
				testOrder.amount = 500;
				
				expect(() => {
					priceValidatorOrder.validate(testOrder);
				}).to.throw(BlError, /orderItems amount is not equal to order.amount/);
			});
		});
		
		context('when payments total amount is not the same as order.amount', () => {
			it('should throw BlError', () => {
			});
		});
	});
});