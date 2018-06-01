import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Item, Branch, Order} from '@wizardcoder/bl-model';
import {PriceService} from "../../../../../../price/price.service";
import {BlDocumentStorage} from "../../../../../../storage/blDocumentStorage";
import {OrderItemRentValidator} from "./order-item-rent-validator";

chai.use(chaiAsPromised);

describe('OrderItemRentValidator', () => {
	const orderItemRentValidator = new OrderItemRentValidator();
	const priceService = new PriceService();
	
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
			branchItems: [],
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
						price: 100,
						maxNumberOfPeriods: 1
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
			price: 600,
			taxRate: 0
		}
	});
	
	describe('validate()', () => {
		
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
		
		it('should resolve when a valid orderItem is passed', () => {
			return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
				.to.eventually.be.fulfilled;
		});
	
		
		it('should reject if orderItem.info is undefined', () => {
			testOrder.orderItems[0].info = undefined;
			
			return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
				.to.be.rejectedWith(BlError, /orderItem.info is not set when orderItem.type is "rent"/);
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
				
				return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
					.to.be.rejectedWith(BlError, /orderItem.info.periodType "semester" is not valid on branch/);
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
					
					return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
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
					
					return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
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
					
					return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
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
					
					return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
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
				testItem.price = 1000;
				
				return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
					.to.be.fulfilled;
			});
		});
		
		context('when branch is responsible for payment', () => {
			beforeEach(() => {
				testBranch.paymentInfo = {
					responsible: true,
					rentPeriods: [
						{
							type: "year",
							maxNumberOfPeriods: 1,
							percentage: 0.5
						}
					],
					extendPeriods: [{
						type: "semester",
						maxNumberOfPeriods: 1,
						price: 100
					}],
					buyout: {
						percentage: 1.0
					},
					acceptedMethods: ['dibs']
				};
			});
			
			it('should resolve with true when orderItem.amount is 0', () => {
				testBranch.paymentInfo = {
					responsible: true,
					rentPeriods: [
						{
							type: "year",
							maxNumberOfPeriods: 1,
							percentage: 0.5
						}
					],
					extendPeriods: [{
						type: "semester",
						maxNumberOfPeriods: 1,
						price: 100
					}],
					buyout: {
						percentage: 1.0
					},
					acceptedMethods: ['dibs']
				};
				
				testOrder.orderItems[0].amount = 0;
				testOrder.orderItems[0].taxAmount = 0;
				testOrder.orderItems[0].type = 'rent';
				testOrder.orderItems[0].info = {
					from: new Date(),
					to: new Date(),
					periodType: 'year',
					numberOfPeriods: 1
				};
				
				return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
					.to.be.fulfilled;
			});
			
			it('should reject if orderItem.amount is not 0', () => {
				testOrder.orderItems[0].amount = 100;
				testOrder.orderItems[0].taxAmount = 100;
				testOrder.orderItems[0].type = 'rent';
				testOrder.orderItems[0].info = {
					from: new Date(),
					to: new Date(),
					periodType: 'year',
					numberOfPeriods: 1
				};
				
				return expect(orderItemRentValidator.validate(testBranch, testOrder.orderItems[0], testItem))
					.to.be.rejectedWith(BlError, /orderItem.amount is "100" when branch.paymentInfo.responsible is true/);
			});
		});
	});
});