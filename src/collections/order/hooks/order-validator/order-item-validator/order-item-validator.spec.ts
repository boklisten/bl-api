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
		context('when required fields of a orderItem is empty or not defined', () => {
			it('should reject if orderItem.item is not defined', () => {
				testOrder.orderItems[0].item = null;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.eventually.rejectedWith(BlError, /orderItem.item is not defined/);
			});
			
			it('should reject if orderItem.title is not defined', () => {
				testOrder.orderItems[0].title = undefined;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.title is not defined/);
			});
			
			it('should reject if orderItem.amount is not defined', () => {
				testOrder.orderItems[0].amount = undefined;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.amount is not defined/);
			});
			
			it('should reject if orderItem.unitPrice is not defined', () => {
				testOrder.orderItems[0].unitPrice = null;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.unitPrice is not defined/);
			});
			
			it('should reject if orderItem.taxAmount is not defined', () => {
				testOrder.orderItems[0].taxAmount = null;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.taxAmount is not defined/);
			});
			
			it('should reject if orderItem.taxRate is not defined', () => {
				testOrder.orderItems[0].taxRate = undefined;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.taxRate is not defined/);
			});
			
			it('should reject if orderItem.type is not defined', () => {
				testOrder.orderItems[0].type = null;
				
				return expect(orderItemValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.type is not defined/);
			});
			
			
		});
		
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