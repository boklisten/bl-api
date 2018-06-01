import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {OrderItemValidator} from "./order-item-validator";
import {Order, BlError, Branch, Item} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../../storage/blDocumentStorage";
import {OrderItemRentValidator} from "./order-item-rent-validator/order-item-rent-validator";
import {OrderItemBuyValidator} from "./order-item-buy-validator/order-item-buy-validator";
import {OrderItemExtendValidator} from "./order-item-extend-validator/order-item-extend-validator";
import {OrderFieldValidator} from "../order-field-validator/order-field-validator";
chai.use(chaiAsPromised);

describe('OrderItemValidator', () => {
	const branchStorage: BlDocumentStorage<Branch> = new BlDocumentStorage('branches');
	const itemStorage: BlDocumentStorage<Item> = new BlDocumentStorage('items');
	const orderItemFieldValidator = new OrderFieldValidator();
	const orderItemRentValidator = new OrderItemRentValidator();
	const orderItemBuyValidator = new OrderItemBuyValidator();
	const orderItemExtendValidator = new OrderItemExtendValidator();
	
	const orderItemValidator = new OrderItemValidator(branchStorage, itemStorage, orderItemFieldValidator,
		orderItemRentValidator, orderItemBuyValidator, orderItemExtendValidator);
	
	let testOrder: Order;
	let testBranch: Branch;
	
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
						maxNumberOfPeriods: 0,
						percentage: 0.5
					}
				],
				extendPeriods: [
					{
						type: "semester",
						maxNumberOfPeriods: 1,
						price: 100
					}
				],
				buyout: {
					percentage: 0.5
				},
				acceptedMethods: ["card", "dibs"]
			}
		};
	});
	
	describe('#validate()', () => {
		
		sinon.stub(branchStorage, 'get').callsFake((id: string) => {
			if (id !== 'branch1') {
				return Promise.reject(new BlError('not found').code(702));
			}
			return Promise.resolve(testBranch);
		});
		
		context('when order.amount is not equal to the total of orderItems amount', () => {
			it('should reject with error whe the order.branch is not found', () => {
				testOrder.branch = 'notFoundBranch';
				
			});
			
			it('should reject with error when order.amount is 500 and total of orderItems is 250', () => {
				testOrder.amount = 500;
				testOrder.orderItems[0].amount = 250;
				
				return expect(orderItemValidator.validate(testBranch, testOrder))
					.to.be.rejectedWith(BlError, /order.amount is "500" but total of orderItems amount is "250"/)
			});
			
			it('should reject with error when order.amount is 100 and total of orderItems is 780', () => {
				testOrder.amount = 100;
				testOrder.orderItems[0].amount = 780;
				
				return expect(orderItemValidator.validate(testBranch, testOrder))
					.to.be.rejectedWith(BlError, /order.amount is "100" but total of orderItems amount is "780"/)
			});
		});
		
	});
});