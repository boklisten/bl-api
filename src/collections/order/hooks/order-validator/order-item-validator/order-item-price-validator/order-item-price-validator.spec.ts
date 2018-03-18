import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {OrderItemPriceValidator} from "./order-item-price-validator";
import {Order, OrderItem, BlError, Item, Branch} from 'bl-model';
import {BlDocumentStorage} from "../../../../../../storage/blDocumentStorage";
import {OrderItemFieldValidator} from "../order-item-field-validator/order-item-field-validator";
import {PriceService} from "../../../../../../price/price.service";

chai.use(chaiAsPromised);

describe('OrderItemPriceValidator', () => {
	const priceService = new PriceService();
	const itemStorage = new BlDocumentStorage<Item>('items');
	const branchStorage = new BlDocumentStorage<Branch>('branches');
	const orderItemFieldValidator = new OrderItemFieldValidator();
	const orderItemPriceValidator = new OrderItemPriceValidator(orderItemFieldValidator, priceService, itemStorage, branchStorage);
	
	let testOrder: Order;
	let testItem: Item;
	let testBranch: Branch;
	
	beforeEach(() => {
		testOrder = {
			id: 'order1',
			amount: 300,
			customer: '',
			orderItems: [
				{
					item: 'item1',
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
		
		testBranch = {
			id: 'branch1',
			name: 'Sonans',
			paymentInfo: {
				responsible: false,
				rentPeriods: [
					{
						type: "semester",
						maxNumberOfPeriods: 2,
						percentage: 0.5
					}
				],
				extendPeriods: [
					{
						type: "semester",
						price: 100
					}
				],
				buyout: {
					percentage: 0.50
				},
				acceptedMethods: ['card']
			}
		};
		
		testItem = {
			id: 'item1',
			title: 'Signatur 3',
			type: 'book',
			info: '',
			desc: '',
			price: 600,
			taxRate: 0,
			sell: false,
			sellPrice: 0,
			rent: true,
			buy: true
		}
	});
	
	sinon.stub(itemStorage, 'get').callsFake((id: string) => {
		if (id !== testItem.id) {
			return Promise.reject(new BlError(`item "${id}" not found`).code(702));
		}
		
		return Promise.resolve(testItem);
	});
	
	sinon.stub(branchStorage, 'get').callsFake((id: string) => {
		if (id !== testBranch.id) {
			return Promise.reject(new BlError(`branch "${id}" not found`).code(702));
		}
		return Promise.resolve(testBranch);
	});
	
	describe('validate()', () => {
		it('should reject if order.orderItems is empty or undefined', () => {
			testOrder.orderItems = [];
			
			return expect(orderItemPriceValidator.validate(testOrder))
				.to.eventually.be.rejectedWith(BlError, /order.orderItems is empty or undefined/);
		});
		
		it('should reject with error when the item of a orderItem is not found', () => {
			testOrder.orderItems[0].item = 'notFoundItem';
			
			return expect(orderItemPriceValidator.validate(testOrder))
				.to.eventually.be.rejectedWith(BlError, /item "notFoundItem" not found/);
		});
		
		it('should resolve when a valid order is passed', () => {
			return expect(orderItemPriceValidator.validate(testOrder))
				.to.eventually.be.fulfilled;
		});
	
		context('when orderItem.type is "buy"', () => {
			beforeEach(() => {
				testOrder.orderItems[0].type = 'buy';
			});
			
			
			context('when discount is not set', () => {
				beforeEach(() => {
					testOrder.orderItems[0].discount = null;
				});
				
				it('should reject if the orderItem.taxRate is not the same as item.taxRate', () => {
					testOrder.orderItems[0].taxRate = 0.75;
					testItem.taxRate = 0.33;
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.rejectedWith(BlError, /orderItem.taxRate "0.75" is not equal to item.taxRate "0.33"/);
				});
				
				it('should reject if the orderItem.taxAmount is not equal to (item.price * item.taxRate)', () => {
					testOrder.orderItems[0].taxAmount = 100;
					testOrder.orderItems[0].taxRate = 0.5;
					testItem.price = 300;
					testItem.taxRate = 0.5;
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.rejectedWith(BlError, /orderItem.taxAmount "100" is not equal to \(orderItem.amount "300" \* item.taxRate "0.5"\) "150"/);
				});
				
				it('should reject when item.price is 200 and orderItem.amount is 100', () => {
					testOrder.orderItems[0].amount = 100;
					testOrder.orderItems[0].taxAmount = 0;
					testOrder.orderItems[0].taxRate = 0;
					testItem.price = 200;
					testItem.taxRate = 0;
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.rejectedWith(BlError, /orderItem.amount "100" is not equal to item.price - orderItem.discount "200"/);
				});
				
				it('should reject if item.price is 134 and orderItem.amount is 400', () => {
					testOrder.orderItems[0].amount = 400;
					testOrder.orderItems[0].taxAmount = 0;
					testOrder.orderItems[0].taxRate = 0;
					testItem.price = 134;
					testItem.taxRate = 0;
					
					return expect(orderItemPriceValidator.validate(testOrder))
							.to.be.rejectedWith(BlError, /orderItem.amount "400" is not equal to item.price - orderItem.discount "134"/);
				});
				
				it('should resolve if a valid order is sent', () => {
					testOrder.orderItems[0].type = 'buy';
					testOrder.orderItems[0].amount = 400;
					testOrder.orderItems[0].item = 'theItem';
					testOrder.amount = 400;
					testItem.price = 400;
					testItem.id = 'theItem';
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.fulfilled;
				});
			});
			
			context('when discount is set', () => {
			    beforeEach(() => {
			    	testOrder.orderItems[0].discount = {
			    		amount: 100
					};
			    	testOrder.orderItems[0].taxAmount = 0;
					testOrder.orderItems[0].taxRate = 0;
					testItem.taxRate = 0;
				});
				
				it('should reject if orderItem.taxAmount is not equal to ((item.price - discount.amount) * item.taxRate)', () => {
					testOrder.orderItems[0].amount = 400;
					testOrder.orderItems[0].taxRate = 0.5;
					testOrder.orderItems[0].taxAmount = 100;
					testOrder.orderItems[0].discount = {
						amount: 100
					};
					testItem.taxRate = 0.5;
					testItem.price = 500;
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.rejectedWith(BlError, /orderItem.taxAmount "100" is not equal to \(orderItem.amount "400" \* item.taxRate "0.5"\) "200"/);
				});
				
				it('should reject if (item.price - discount.amount) is 400 but orderItem.amount is 100', () => {
					testOrder.orderItems[0].amount = 100;
					testItem.price = 500;
					testOrder.orderItems[0].discount = {
						amount: 100
					};
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.rejectedWith(BlError, /orderItem.amount "100" is not equal to item.price - orderItem.discount "400"/);
				});
				
				it('should reject if (item.price - discount.amount) is 200 but orderItem.amount is 560', () => {
					testOrder.orderItems[0].amount = 560;
					testItem.price = 500;
					testOrder.orderItems[0].discount = {
						amount: 300
					};
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.rejectedWith(BlError, /orderItem.amount "560" is not equal to item.price - orderItem.discount "200"/);
				});
				
				it('should resolve if a valid order is placed', () => {
					testOrder.orderItems[0].amount = 300;
					testOrder.orderItems[0].item = 'theItem1';
					testOrder.orderItems[0].discount = {
						amount: 300
					};
					testOrder.amount = 300;
					testItem.id = 'theItem1';
					testItem.price = 600;
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.fulfilled;
				});
			});
		});
		
		context('when orderItem.type is "rent"', () => {
			beforeEach(() => {
				testOrder.orderItems[0].type = 'rent';
				testOrder.orderItems[0].info = {
					from: new Date(),
					to: new Date(),
					numberOfPeriods: 1,
					periodType: "semester"
				};
				testOrder.orderItems[0].taxAmount = 0;
				testOrder.orderItems[0].taxRate = 0;
				testItem.taxRate = 0;
			});
			
			it('should reject if order.branch is not found', () => {
				testOrder.branch = 'notFoundBranch';
				
				return expect(orderItemPriceValidator.validate(testOrder))
					.to.be.rejectedWith(BlError, /branch "notFoundBranch" not found/);
			});
			
			it('should reject if orderItem.info is undefined', () => {
				testOrder.orderItems[0].info = undefined;
				
				return expect(orderItemPriceValidator.validate(testOrder))
					.to.be.rejectedWith(BlError, /orderItem.info is not set when orderItem.type is "rent"/);
			});
			
			it('should reject if item.rent is false', () => {
				testItem.rent = false;
				testOrder.orderItems[0].type = 'rent';
				
				return expect(orderItemPriceValidator.validate(testOrder))
					.to.be.rejectedWith(BlError, /orderItem.type is "rent" but item.rent is false/);
			});
			
			context('when periodType is not allowed at branch', () => {
				it('should reject if branch.payment.periods does not include "semester"', () => {
					testBranch.paymentInfo.rentPeriods = [
						{
							type: "year",
							maxNumberOfPeriods: 1,
							percentage: 0.5
						}
					];
					testOrder.orderItems[0].info.periodType = "semester";
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.rejectedWith(BlError, /rent price could not be validated/);
				});
			});
			
			context('when discount is not set', () => {
				context('when orderItem.amount is not equal to item.price * branch.paymentInfo.percentage', () => {
					it('should reject if orderItem amount is 100 but (item.price * branch.paymentInfo.percentage) is 200', () => {
						testOrder.orderItems[0].amount = 100;
						testBranch.paymentInfo.rentPeriods = [
							{
								type: "semester",
								maxNumberOfPeriods: 1,
								percentage: 0.5
							}
						];
						testItem.price = 400;
						
						return expect(orderItemPriceValidator.validate(testOrder))
							.to.be.rejectedWith(BlError, /orderItem.amount "100" is not equal to the rental price "200"/);
					});
					
					it('should reject if orderItem amount is 50 but (item.price * branch.paymentInfo.percentage) is 20', () => {
						testOrder.orderItems[0].amount = 100;
						testBranch.paymentInfo.rentPeriods = [
							{
								type: "semester",
								maxNumberOfPeriods: 1,
								percentage: 0.234
							}
						];
						testItem.price = 110;
						
						let expectedAmount = priceService.sanitize(110 * 0.234);
						
						return expect(orderItemPriceValidator.validate(testOrder))
							.to.be.rejectedWith(BlError, `orderItem.amount "100" is not equal to the rental price "${expectedAmount}"`);
					});
					
					it('should resolve if a valid order is passed', () => {
						testOrder.orderItems = [
							{
								item: 'theItem2',
								title: 'A title',
								amount: 300,
								unitPrice: 500,
								taxAmount: 150,
								taxRate: 0.50,
								rentRate: 0.50,
								type: 'rent',
								info: {
									from: new Date(),
									to: new Date(),
									numberOfPeriods: 1,
									periodType: 'semester',
								}
							}
						];
						
						testItem.id = 'theItem2';
						testItem.price = 600;
						testItem.taxRate = 0.50;
						testOrder.amount = 900;
						
						return expect(orderItemPriceValidator.validate(testOrder))
							.to.eventually.be.fulfilled;
					});
				});
			});
			
			context('when discount is set', () => {
			    context('when orderItem.amount is not equal to (item.price * branch.paymentInfo.percentage) - discount.amount', () => {
					it('should reject if orderItem.amount is 460 but (item.price * branch.paymentInfo.percentage) - discount.amount is 500', () => {
						testOrder.orderItems[0].amount = 460;
						testOrder.orderItems[0].discount = {amount: 100};
						testBranch.paymentInfo.rentPeriods = [
							{
								type: "semester",
								maxNumberOfPeriods: 1,
								percentage: 0.5
							}
						];
						testItem.price = 1200;
						
						
						let expectedAmount = priceService.sanitize((1200 * 0.5) - 100);
						
						return expect(orderItemPriceValidator.validate(testOrder))
							.to.be.rejectedWith(BlError, `orderItem.amount "460" is not equal to the rental price "${expectedAmount}"`);
					});
			    });
				
				it('should resolve when a valid order is set', () => {
					testOrder.orderItems[0].amount = 500;
					testOrder.orderItems[0].type = "rent";
					testOrder.orderItems[0].info = {
						from: new Date(),
						to: new Date(),
						periodType: "semester",
						numberOfPeriods: 1
					};
					testOrder.amount = 500;
					
					testBranch.paymentInfo.rentPeriods = [
						{
							type: "semester",
							maxNumberOfPeriods: 1,
							percentage: 0.5
						}
					];
					testItem.rent = true;
					testItem.price = 1000;
					
					return expect(orderItemPriceValidator.validate(testOrder))
						.to.be.fulfilled;
				});
			});
		});
	});
	
	
});