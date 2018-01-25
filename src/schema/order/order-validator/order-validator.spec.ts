import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {Order, BlError, CustomerItem, Item, OrderPayment, Branch} from "bl-model";
import {SEDocument} from "../../../db/model/se.document";
import {CustomerItemSchema} from "../../customer-item/customer-item.schema";
import {SESchema} from "../../../config/schema/se.schema";
import {ItemSchema} from "../../item/item.schema";
import {OrderValidator} from "./order-validator";
import {EndpointMongodb} from "../../../endpoint/endpoint.mongodb";
import * as sinon from 'sinon';
import {BranchSchema} from "../../branch/branch.schema";

chai.use(chaiAsPromised);

describe('OrderValidator', () => {
	
	
	const itemMongo = new EndpointMongodb(new SESchema('items', ItemSchema));
	const customerItemMongo = new EndpointMongodb(new SESchema('customerItems', CustomerItemSchema));
	const branchMongo = new EndpointMongodb(new SESchema('branches', BranchSchema));
	const orderValidator: OrderValidator = new OrderValidator(itemMongo, customerItemMongo, branchMongo);
	
	let testOrder: Order;
	
	beforeEach(() => {
		testOrder = {
			id: 'o1',
			amount: 450,
			orderItems: [
				{
					type: "buy",
					amount: 300,
					item: 'i1'
				},
				{
					type: "rent",
					amount: 150,
					item: 'i2',
					customerItem: 'ci2',
					rentInfo: {
						oneSemester: true,
						twoSemesters: false
					}
				}
			],
			branch: 'b1',
			byCustomer: true,
			payments: [
				{
					method: "card",
					amount: 50.0,
					confirmed: true,
					byBranch: false,
					time: new Date()
				},
				{
					method: "cash",
					amount: 400.0,
					confirmed: true,
					byBranch: false,
					time: new Date()
				}
			],
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
		sinon.stub(branchMongo, 'getById').callsFake((id: string) => {
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
					resolve([new SEDocument('branch', branch)]);
				} else {
			    	reject(new BlError('not found'));
				}
				
			});
		});
		
		sinon.stub(customerItemMongo, 'getManyById').callsFake((ids: string[]) => {
				const testCustomerItem1: CustomerItem = {
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
				};
				
				const testCustomerItem2: CustomerItem = {
					id: 'ci2',
					creationTime: new Date(),
					lastUpdated: new Date(),
					comments: [],
					active: true,
					user: {
						id: 'u2'
					},
					item: 'i2',
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
					totalAmount: 150,
					orderItems: ["oi1"],
					deadlineExtends: []
				};
				
				const testCustomerItem3: CustomerItem = {
					id: 'ci3',
					creationTime: new Date(),
					lastUpdated: new Date(),
					comments: [],
					active: true,
					user: {
						id: 'u2'
					},
					item: 'i3',
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
				};
				let res: SEDocument[] = [];
				
				if (ids.indexOf('ci1') > -1) res.push(new SEDocument('customerItem', testCustomerItem1));
				if (ids.indexOf('ci2') > -1) res.push(new SEDocument('customerItem', testCustomerItem2));
				if (ids.indexOf('ci3') > -1) res.push(new SEDocument('customerItem', testCustomerItem2));
				if (res.length <= 0) return Promise.reject(new BlError('not found').code(702));
				return Promise.resolve(res);
			});
		
		sinon.stub(itemMongo, 'getManyById').callsFake((ids: string[]) => {
			const testItem1: Item = {
				id: 'i1',
				creationTime: new Date(),
				lastUpdated: new Date(),
				active: true,
				comments: [],
				user: {
					id: 'u1'
				},
				title: 'Signatur 2',
				type: 'book',
				info: {
					isbn: '123'
				},
				desc: '',
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
				user: {
					id: 'u1'
				},
				title: 'Signatur 2',
				type: 'book',
				info: {
					isbn: '1234'
				},
				desc: '',
				price: 300,
				sell: true,
				sellPrice: 20,
				rent: true,
				buy: true
			};
			
			let res: SEDocument[] = [];
			if (ids.indexOf('i1') > -1) res.push(new SEDocument('item', testItem1));
			if (ids.indexOf('i2') > -1) res.push(new SEDocument('item', testItem2))
			if (res.length < ids.length) return Promise.reject(new BlError('not found').code(702));
			return Promise.resolve(res);
		});
		
		it('should return true when all parameters are valid', () => {
			return orderValidator.validate(testOrder)
				.should.be.fulfilled;
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
