import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {Order, BlError, CustomerItem, Item, Branch, Payment, Delivery} from "bl-model";
import {OrderValidator} from "./order-validator";
import * as sinon from 'sinon';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";

chai.use(chaiAsPromised);

describe('OrderValidator', () => {
	let testOrder: Order;
	const branchStorage: BlDocumentStorage<Branch> = new BlDocumentStorage('branches');
	const itemStorage: BlDocumentStorage<Item> = new BlDocumentStorage('items');
	const paymentStorage: BlDocumentStorage<Payment> = new BlDocumentStorage('payments');
	const deliveryStorage: BlDocumentStorage<Delivery> = new BlDocumentStorage('deliveries');
	const orderValidator: OrderValidator = new OrderValidator(branchStorage, itemStorage, deliveryStorage, paymentStorage);
	
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
			payments: ['payment1'],
		};
	});
	
	sinon.stub(branchStorage, 'get').callsFake((id: string) => {
		return new Promise((resolve, reject) => {
			if (id === 'b1') {
				const branch: Branch = {
						id: 'b1',
						name: 'testBranch',
						type: 'school',
						desc: '',
						root: true,
						childBranches: [''],
						items: [],
						openingHours: [],
						itemCategories: [],
						payment: {
							branchResponsible: false,
							rentPricePercentage: {
								base: 0.70,
								oneSemester: 0.5,
								twoSemesters: 0.5,
								buyout: 100
							},
							extendPrice: 100,
							acceptedMethods: []
						},
						comments: [],
						active: true,
						lastUpdated: new Date(),
						creationTime: new Date()
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
	});
});
