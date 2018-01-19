import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, CustomerItem, OrderItem} from "bl-model";
import {PriceValidatorCancelRent} from "./price-validator-cancel-rent";

chai.use(chaiAsPromised);

describe('PriceValidatorCancelRent', () => {
	
	describe('#validateOrderItem()', () => {
		const priceValidatorCancelRent: PriceValidatorCancelRent = new PriceValidatorCancelRent();
		let testOrderItem: OrderItem;
		let testCustomerItem: CustomerItem;
		
		beforeEach(() => {
			testOrderItem = {
				item: 'i1',
				amount: 100,
				type: "cancel-rent",
				customerItem: 'ci1'
			};
			
			testCustomerItem = {
				id: 'ci1',
				creationTime: new Date(),
				lastUpdated: new Date(),
				comments: [],
				active: true,
				user: {
					id: 'u1'
				},
				item: 'i1',
				deadline: new Date(),
				status: '',
				handout: true,
				handoutTime: new Date(),
				handoutBranch: '',
				handoutEmployee: '',
				returned: false,
				returnTime: new Date(),
				returnBranch: '',
				returnEmployee: '',
				totalAmount: 100,
				orderItems: ["oi1"],
				deadlineExtends: []
			}
		});
		
		it('should throw error if orderItem.type is not equal to cancel-rent', () => {
			testOrderItem.type = 'buy';
			
			expect(() => {
				priceValidatorCancelRent.validateOrderItem(testOrderItem, testCustomerItem);
			}).to.throw(BlError, /orderItem.type is not equal to "cancel-rent"/)
		});
		
		it('should throw error if orderItem.customerItem is not defined', () => {
			testOrderItem.customerItem = null;
			
			expect(() => {
				priceValidatorCancelRent.validateOrderItem(testOrderItem, testCustomerItem);
			}).to.throw(BlError, /orderItem.customerItem is not defined/)
		});
		
		context('when customerItem can\'t be canceled', () => {
			it('should throw error when customerItem.returned = true', () => {
				testCustomerItem.returned = true;
				
				expect(() => {
					priceValidatorCancelRent.validateOrderItem(testOrderItem, testCustomerItem);
				}).to.throw(BlError, /customerItem.returned = true/);
			});
			
			it('should throw error when customerItem.deadlineExtends is not empty', () => {
				testCustomerItem.deadlineExtends = [{
					oldDeadline: new Date(),
					newDeadline: new Date(),
					orderItem: '',
					time: new Date()
				}];
				
				expect(() => {
					priceValidatorCancelRent.validateOrderItem(testOrderItem, testCustomerItem);
				}).to.throw(BlError, /customerItem.deadlineExtends is not empty/);
			});
		});
		
		context('when orderItem.amount does not match the customerItem.totalAmount', () => {
			
			
			describe('should throw error when', () => {
				afterEach(() => {
					expect(() => {
						priceValidatorCancelRent.validateOrderItem(testOrderItem, testCustomerItem);
					}).to.throw(BlError, /orderItem.amount is not correct/);
				});
				
				it('orderItem.amount = -100 and customerItem.totalAmount is 300', () => {
					testCustomerItem.totalAmount = 300;
					testOrderItem.amount = -100;
				});
				
				it('orderItem.amount = -60.3 and customerItem.totalAmount is 60.4', () => {
					testCustomerItem.totalAmount = 60.4;
					testOrderItem.amount = -60.5;
				});
				
				it('orderItem.amount = -300, orderItem.discount = -100 customerItem.totalAmount is 500', () => {
					testCustomerItem.totalAmount = 500;
					testOrderItem.amount = -300;
					testOrderItem.discount = -100;
				});
			});
			
			describe('should return true when ', () => {
				afterEach(() => {
					expect(priceValidatorCancelRent.validateOrderItem(testOrderItem, testCustomerItem))
						.to.be.true;
				});
				
				it('orderItem.amount = -100 and customerItem.totalAmount is 100', () => {
					testCustomerItem.totalAmount = 100;
					testOrderItem.amount = -100;
				});
				
				it('orderItem.amount = -33.3 and customerItem.totalAmount is 33.3', () => {
					testCustomerItem.totalAmount = 33.3;
					testOrderItem.amount = -33.3;
				});
				
				it('orderItem.amount = -600, orderItem.discount = -50.3 customerItem.totalAmount is 650.3', () => {
					testCustomerItem.totalAmount = 650.3;
					testOrderItem.amount = -600;
					testOrderItem.discount = -50.3;
				});
			});
		});
		
	});
});