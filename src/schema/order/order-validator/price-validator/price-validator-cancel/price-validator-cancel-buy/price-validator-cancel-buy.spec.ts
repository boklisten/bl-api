import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, CustomerItem, Item, OrderItem} from "bl-model";
import {PriceValidatorCancelBuy} from "./price-validator-cancel-buy";

chai.use(chaiAsPromised);

describe('PriceValidatorCancelBuy', () => {
	
	describe('#validateOrderItem()', () => {
		const priceValidatorCancelBuy: PriceValidatorCancelBuy = new PriceValidatorCancelBuy();
		let testOrderItem: OrderItem;
		let testCustomerItem: CustomerItem;
		let testItem: Item;
		
		beforeEach(() => {
			testOrderItem = {
				item: 'i1',
				amount: -100,
				taxAmount: 0,
				taxRate: 0,
				unitPrice: 100,
				rentRate: 0,
				title: 'signatur 3',
				type: "cancel-rent",
				lastOrderItem: {
					item: 'i1',
					title: 'signatur 3',
					taxAmount: 0,
					taxRate: 0,
					unitPrice: 100,
					rentRate: 0,
					amount: 100,
					type: 'buy'
				}
			};
			
			testItem = {
				id: 'i1',
				categories: [],
				title: 'Signatur 2',
				type: 'book',
				info: {
					isbn: ''
				},
				desc: '',
				taxRate: 0,
				price: 100,
				sell: true,
				sellPrice: 100,
				rent: true,
				buy: true,
				creationTime: new Date(),
				lastUpdated: new Date(),
				comments: [],
				active: true
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
		
		it('should throw error if orderItem.type is not equal to "cancel-buy"', () => {
			testOrderItem.type = 'rent';
			expect(() => {
				priceValidatorCancelBuy.validateOrderItem(testOrderItem, testItem);
			}).to.throw(BlError, /orderItem.type is not "cancel-buy"/);
		});
		
		it('should throw error if orderItem.lastOrderItem is not defined', () => {
			testOrderItem.type = 'cancel-buy';
			testOrderItem.lastOrderItem = null;
			
			expect(() => {
				priceValidatorCancelBuy.validateOrderItem(testOrderItem, testItem);
			}).to.throw(BlError, /orderItem.lastOrderItem is not defined/);
		});
		
		it('should throw error if orderItem.lastOrderItem.type is not "buy"', () => {
			testOrderItem.type = 'cancel-buy';
			testOrderItem.lastOrderItem = {
				item: 'i1',
				title: 'signatur',
				unitPrice: 100,
				rentRate: 0,
				taxRate: 0,
				taxAmount: 0,
				type: 'rent',
				amount: 100
			};
			
			expect(() => {
				priceValidatorCancelBuy.validateOrderItem(testOrderItem, testItem);
			}).to.throw(BlError, /orderItem.lastOrderItem.type is not "buy"/);
		});
		
		context('orderItem.amount and item.price should match', () => {
			describe('should throw error when', () => {
				it('orderItem.amount is -100 and orderItem.lastOrderItem.amount is 200', () => {
					
					testOrderItem.type = 'cancel-buy';
					testOrderItem.amount = -100;
					testOrderItem.lastOrderItem = {
						item: 'i1',
						title: 'signatur',
						unitPrice: 100,
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						type: 'buy',
						amount: 200
					};
					
					expect(() => {
						priceValidatorCancelBuy.validateOrderItem(testOrderItem, testItem);
					}).to.throw(BlError, /orderItem.amount is not correct/);
				});
			});
			
			describe('should return true when ', () => {
				it('orderItem.amount is -100 and orderItem.lastOrderItem.amount is 100', () => {
					
					testOrderItem.type = 'cancel-buy';
					testOrderItem.amount = -100;
					testOrderItem.lastOrderItem = {
						item: 'i1',
						title: 'signatur',
						unitPrice: 100,
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						type: 'buy',
						amount: 100
					};
					
					expect(priceValidatorCancelBuy.validateOrderItem(testOrderItem, testItem))
						.to.be.true;
				});
			});
		});
	});
});