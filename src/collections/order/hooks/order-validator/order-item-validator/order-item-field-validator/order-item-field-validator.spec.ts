import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Order} from 'bl-model';
import {OrderItemFieldValidator} from "./order-item-field-validator";

chai.use(chaiAsPromised);

describe('OrderItemFieldValidator', () => {
	let testOrder: Order;
	let orderItemFieldValidator = new OrderItemFieldValidator();
	
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
		context('when required fields of order is empty or undefined', () => {
			it('should reject if order.orderItems is not defined', () => {
				testOrder.orderItems = [];
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, 'order.orderItems is empty or undefined');
			});
		});
		
		context('when required fields of a orderItem is empty or not defined', () => {
			it('should reject if orderItem.item is not defined', () => {
				testOrder.orderItems[0].item = null;
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.rejectedWith(BlError, /orderItem.item is not defined/);
			});
			
			it('should reject if orderItem.title is not defined', () => {
				testOrder.orderItems[0].title = undefined;
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.title is not defined/);
			});
			
			it('should reject if orderItem.amount is not defined', () => {
				testOrder.orderItems[0].amount = undefined;
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.amount is not defined/);
			});
			
			it('should reject if orderItem.unitPrice is not defined', () => {
				testOrder.orderItems[0].unitPrice = null;
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.unitPrice is not defined/);
			});
			
			it('should reject if orderItem.taxAmount is not defined', () => {
				testOrder.orderItems[0].taxAmount = null;
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.taxAmount is not defined/);
			});
			
			it('should reject if orderItem.taxRate is not defined', () => {
				testOrder.orderItems[0].taxRate = undefined;
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.taxRate is not defined/);
			});
			
			it('should reject if orderItem.type is not defined', () => {
				testOrder.orderItems[0].type = null;
				
				return expect(orderItemFieldValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItem.type is not defined/);
			});
			
			
		});
	});
});