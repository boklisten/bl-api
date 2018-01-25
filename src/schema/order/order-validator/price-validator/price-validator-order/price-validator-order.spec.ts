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
						item: 'i1'
					},
					{
						type: "rent",
						amount: 100,
						item: 'i1',
						customerItem: 'ci1'
					}
				],
				branch: 'b1',
				byCustomer: true,
				payments: [
					{
						method: "card",
						amount: 50.0,
						confirmed: true,
						byBranch: false,
						time: new Date()
					},
					{
						method: "cash",
						amount: 350.0,
						confirmed: true,
						byBranch: false,
						time: new Date()
					}
				],
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
						item: 'i1'
					},
					{
						type: "rent",
						amount: 100,
						item: 'i2'
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
				testOrder.payments = [
					{
						method: "card",
						amount: 100,
						confirmed: false,
						byBranch: false,
						time: new Date()
					},
					{
						method: "cash",
						amount: 450.8,
						confirmed: false,
						byBranch: false,
						time: new Date()
					}
				];
				testOrder.amount = 200;
				
				expect(() => {
					priceValidatorOrder.validate(testOrder);
				}).to.throw(BlError, /payments total amount is not equal to order.amount/);
			});
		});
		
		context('if ', () => {
			it('should throw BlError', () => {
				testOrder.payments = [
					{
						method: "card",
						amount: 100,
						confirmed: false,
						byBranch: false,
						time: new Date()
					},
					{
						method: "cash",
						amount: 450.8,
						confirmed: false,
						byBranch: false,
						time: new Date()
					}
				];
				testOrder.amount = 200;
				
				expect(() => {
					priceValidatorOrder.validate(testOrder);
				}).to.throw(BlError, /payments total amount is not equal to order.amount/);
			});
		});
	});
});