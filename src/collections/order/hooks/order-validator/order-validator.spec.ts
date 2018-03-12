import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {Order, BlError, CustomerItem, Item, Branch} from "bl-model";
import {SEDocument} from "../../../../db/model/se.document";
import {OrderValidator} from "./order-validator";
import * as sinon from 'sinon';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {branchSchema} from "../../../branch/branch.schema";
import {itemSchema} from "../../../item/item.schema";

chai.use(chaiAsPromised);

describe('OrderValidator', () => {
	
	
	let testOrder: Order;
	
	const branchStorage: BlDocumentStorage<Branch> = new BlDocumentStorage('branches', branchSchema);
	const itemStorage: BlDocumentStorage<Item> = new BlDocumentStorage('items', itemSchema);
	const orderValidator: OrderValidator = new OrderValidator(branchStorage, itemStorage);
	
	
	beforeEach(() => {
		testOrder = {
			id: 'o1',
			amount: 450,
			orderItems: [
				{
					type: "buy",
					amount: 300,
					item: 'i1',
					title: 'signatur',
					rentRate: 0,
					taxRate: 0,
					taxAmount: 0,
					unitPrice: 300
				},
				{
					type: "rent",
					amount: 150,
					item: 'i2',
					customerItem: 'ci2',
					title: 'signatur',
					rentRate: 0,
					taxRate: 0,
					taxAmount: 0,
					unitPrice: 300,
					rentInfo: {
						oneSemester: true,
						twoSemesters: false
					}
				}
			],
			delivery: '',
			branch: 'b1',
			byCustomer: true,
			payments: [],
			comments: [],
			active: false,
			user: {
				id: 'u1'
			},
			lastUpdated: new Date(),
			creationTime: new Date()
		};
	});
	
	describe('#validate()', () => {
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
									twoSemesters: 0.70,
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
				id: 'i1',
				creationTime: new Date(),
				lastUpdated: new Date(),
				active: true,
				comments: [],
				user: {
					id: 'u1'
				},
				categories: [],
				title: 'Signatur 2',
				type: 'book',
				info: {
					isbn: '123'
				},
				desc: '',
				taxRate: 0,
				price: 300,
				sell: true,
				sellPrice: 100,
				rent: true,
				buy: true
			};
			const testItem2: Item = {
				id: 'i2',
				creationTime: new Date(),
				lastUpdated: new Date(),
				active: true,
				comments: [],
				categories: [],
				user: {
					id: 'u1'
				},
				title: 'Signatur 2',
				type: 'book',
				info: {
					isbn: '1234'
				},
				desc: '',
				taxRate: 0,
				price: 300,
				sell: true,
				sellPrice: 20,
				rent: true,
				buy: true
			};
			
			let res: Item[] = [];
			if (ids.indexOf('i1') > -1) res.push(testItem1);
			if (ids.indexOf('i2') > -1) res.push(testItem2)
			if (res.length < ids.length) return Promise.reject(new BlError('not found').code(702));
			return Promise.resolve(res);
		});
		
		it('should return true when all parameters are valid', () => {
			
			return orderValidator.validate(testOrder)
				.should.be.fulfilled;
		});
		
		it('should throw error if order.orderItems is empty', () => {
			testOrder.orderItems = [];
			
			return orderValidator.validate(testOrder)
				.should.be.rejectedWith(BlError);
		});
		
		context('when order is not valid', () => {
			it('should throw error when one of the items in order is not found', () => {
				testOrder.orderItems[0].item = 'notAvalidObjid';
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError);
			});
		});
		
		it('should throw error when the order.amount is not equal to orderItems or payments', () => {
			testOrder.amount = 0;
			
			return orderValidator.validate(testOrder)
				.should.be.rejectedWith(BlError);
		});
		
		it('should throw error when orderItems is empty', () => {
			testOrder.orderItems = [];
			
			return orderValidator.validate(testOrder)
				.should.be.rejectedWith(BlError);
		});
		
		
		
	});
});
