import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {OrderItemPriceValidator} from "./order-item-price-validator";
import {Order, OrderItem, BlError} from 'bl-model';

chai.use(chaiAsPromised);

describe('OrderItemPriceValidator', () => {
	const orderItemPriceValidator = new OrderItemPriceValidator();
	let testOrder: Order;
	
	beforeEach(() => {
		testOrder = {
			id: 'order1',
			amount: 300,
			customer: '',
			orderItems: [
				{
					item: 'item2',
					title: 'Spinn',
					amount: 300,
					unitPrice: 600,
					taxAmount: 0,
					taxRate: 0,
					rentRate: 0.5,
					type: 'rent',
					info: {
						from: new Date(),
						to: new Date(),
						numberOfPeriods: 1,
						periodType: "semester"
					}
				}
			],
			delivery: 'delivery1',
			branch: 'branch1',
			byCustomer: true,
			payments: ['payment1']
		};
	});
	
	describe('validate()', () => {
		it('should reject if order.orderItems is empty or undefined', () => {
			testOrder.orderItems = [];
			
			return expect(orderItemPriceValidator.validate(testOrder))
				.to.eventually.be.rejectedWith(BlError, /order.orderItems is empty or undefined/);
		});
	});
});