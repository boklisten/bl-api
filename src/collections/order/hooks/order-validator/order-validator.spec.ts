import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {Order, BlError, CustomerItem, Item, Branch, Payment, Delivery} from "bl-model";
import {OrderValidator} from "./order-validator";
import * as sinon from 'sinon';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {OrderItemValidator} from "./order-item-validator/order-item-validator";
import {OrderPlacedValidator} from "./order-placed-validator/order-placed-validator";
import {BranchValidator} from "./branch-validator/branch-validator";

chai.use(chaiAsPromised);

describe('OrderValidator', () => {
	let testOrder: Order;
	const branchStorage: BlDocumentStorage<Branch> = new BlDocumentStorage('branches');
	const itemStorage: BlDocumentStorage<Item> = new BlDocumentStorage('items');
	const paymentStorage: BlDocumentStorage<Payment> = new BlDocumentStorage('payments');
	const deliveryStorage: BlDocumentStorage<Delivery> = new BlDocumentStorage('deliveries');
	
	const branchValidator = new BranchValidator();
	const orderItemValidator = new OrderItemValidator();
	const orderPlacedValidator = new OrderPlacedValidator();
	const orderValidator: OrderValidator = new OrderValidator(orderItemValidator, orderPlacedValidator, branchValidator);
	
	
	sinon.stub(branchStorage, 'get').callsFake((id: string) => {
		return new Promise((resolve, reject) => {
			if (id === 'b1') {
				const branch: Branch = {
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
				resolve(branch);
			} else {
				reject(new BlError('not found'));
			}
		});
	});
		
	sinon.stub(itemStorage, 'getMany').callsFake((ids: string[]) => {
		const testItem1: Item = {
			id: 'item1',
			categories: [],
			title: 'Signatur 2',
			type: 'book',
			info: {
				isbn: '123'
			},
			desc: '',
			taxRate: 0,
			price: 100,
			sell: true,
			sellPrice: 100,
			rent: true,
			buy: true
		};
		
		if (!ids[0] || ids[0] !== 'item1') {
			return Promise.reject(new BlError('not found').code(702));
		}
		
		return Promise.resolve(testItem1);
	});
	
	
	let orderItemShouldResolve;
	let orderPlacedShouldResolve;
	let branchValidatorShouldResolve;
	
	beforeEach(() => {
		orderItemShouldResolve = true;
		orderPlacedShouldResolve = true;
		branchValidatorShouldResolve = true;
		
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
			payments: ['payment1'],
		};
	});
	
	sinon.stub(orderItemValidator, 'validate').callsFake((order: Order) => {
		if (!orderItemShouldResolve) {
			return Promise.reject(new BlError('orderItems not valid'))
		}
		return Promise.resolve(true);
	});
	
	
	sinon.stub(orderPlacedValidator, 'validate').callsFake((order: Order) => {
		if (!orderPlacedShouldResolve) {
			return Promise.reject(new BlError('validation of order.placed failed'))
		}
		return Promise.resolve(true);
	});
	
	
	sinon.stub(branchValidator, 'validate').callsFake((order: Order) => {
		if (!branchValidatorShouldResolve) {
			return Promise.reject(new BlError('validation of branch failed'))
		}
		return Promise.resolve(true);
	});
	
		
	describe('#validate()', () => {
		it('should reject if amount is null or undefined', () => {
			testOrder.amount = undefined;
			return expect(orderValidator.validate(testOrder))
				.to.eventually.be.rejectedWith(BlError, /order.amount is undefined/);
		});
		
		it('should reject if orderItems is empty or undefined', () => {
			testOrder.orderItems = [];
			return expect(orderValidator.validate(testOrder))
				.to.eventually.be.rejectedWith(BlError, /order.orderItems is empty or undefined/);
		});
		
		context('when orderItemValidator rejects', () => {
			it('should reject with error', () => {
				orderItemShouldResolve = false;
				
				return expect(orderValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /orderItems not valid/);
			});
		});
		
		context('when orderPlacedValidator rejects', () => {
			it('should reject with error', () => {
				orderPlacedShouldResolve = false;
				
				return expect(orderValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /validation of order.placed failed/);
			});
		});
		
		context('when branchValidator rejects', () => {
			it('should reject with error', () => {
				branchValidatorShouldResolve = false;
				return expect(orderValidator.validate(testOrder))
					.to.eventually.be.rejectedWith(BlError, /validation of branch failed/);
			});
			
		 
		});
		
	});
});
