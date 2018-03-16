import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {OrderItemValidator} from "./order-item-validator";
import {Order, BlError} from 'bl-model';
chai.use(chaiAsPromised);

describe('OrderItemValidator', () => {
	const orderItemValidator = new OrderItemValidator();
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
	
	describe('#validate()', () => {
		
		
		context('when order.amount is not equal to the total of orderItems amount', () => {
			it('should reject with error when order.amount is 500 and total of orderItems is 250', () => {
				testOrder.amount = 500;
				testOrder.orderItems[0].amount = 250;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.be.rejectedWith(BlError, /order.amount is "500" but total of orderItems amount is "250"/)
			});
			
			it('should reject with error when order.amount is 100 and total of orderItems is 780', () => {
				testOrder.amount = 100;
				testOrder.orderItems[0].amount = 780;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.be.rejectedWith(BlError, /order.amount is "100" but total of orderItems amount is "780"/)
			});
		});
		
	});
});