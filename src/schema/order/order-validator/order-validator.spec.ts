import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {Order, BlError, CustomerItem, Item, OrderPayment} from "bl-model";
import {SEDocument} from "../../../db/model/se.document";
import {CustomerItemSchema} from "../../customer-item/customer-item.schema";
import {SESchema} from "../../../config/schema/se.schema";
import {ItemSchema} from "../../item/item.schema";
import {OrderValidator} from "./order-validator";
import {EndpointMongodb} from "../../../endpoint/endpoint.mongodb";
import * as sinon from 'sinon';

chai.use(chaiAsPromised);

describe('OrderValidator', () => {
	
	
	const itemMongo = new EndpointMongodb(new SESchema('items', ItemSchema));
	const customerItemMongo = new EndpointMongodb(new SESchema('customerItems', CustomerItemSchema));
	const orderValidator: OrderValidator = new OrderValidator(itemMongo, customerItemMongo);
	
	let testOrder: Order;
	
	beforeEach(() => {
		testOrder = {
			id: 'o1',
			amount: 400,
			orderItems: [
				{
					type: "buy",
					amount: 300,
					item: 'i1'
				},
				{
					type: "rent",
					amount: 100,
					item: 'i1',
					customerItem: 'ci1'
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
					amount: 350.0,
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
					totalAmount: 400,
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
					totalAmount: 100,
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
				price: 100,
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
				price: 50,
				sell: true,
				sellPrice: 20,
				rent: true,
				buy: true
			};
			
			let res: SEDocument[] = [];
			if (ids.indexOf('i1') > -1) res.push(new SEDocument('item', testItem1));
			if (ids.indexOf('i2') > -1) res.push(new SEDocument('item', testItem2))
			if (res.length <= 0) return Promise.reject(new BlError('not found').code(702));
			return Promise.resolve(res);
		});
		
		
		context('Order are not valid', () => {
			describe('should reject with BlError when', () => {
				
				it('total amount is not equal to the total amount in orderItems', (done) => {
					testOrder.amount = 340;
					
					orderValidator.validate(testOrder).catch((err: BlError) => {
						expect(err.getMsg()).to.contain('not equal the total of all order item amounts');
						done();
					});
				});
				
				it('total of all payments in Order does not equal the total amount in Order', (done) => {
					testOrder.payments = [
						{
							method: "card",
							amount: 30,
							confirmed: true,
							byBranch: false,
							time: new Date()
						}
					];
					
					orderValidator.validate(testOrder).catch((err: BlError) => {
						expect(err.getMsg()).to.contain('not equal the total of all payments');
						done();
					});
				});
			});
		});
		
		context('CustomerItems is not valid', () => {
			
			it('should reject with BlError when a customerItem does not exist', (done) => {
				
				testOrder.orderItems = [
					{
						type: "rent",
						amount: 400,
						item: 'i1',
						customerItem: 'notValidId'
					}
				];
				
				orderValidator.validate(testOrder).catch((validateError: BlError) => {
					expect(validateError.getMsg()).to.contain('could not get customerItem');
					done();
				});
			});
		});
		
		context('items of orderItems is not valid', () => {
			it('should reject with BlError when a item does not exist', () => {
				
				testOrder.orderItems = [
					{
						type: "rent",
						amount: 400,
						item: 'notValid',
						customerItem: 'ci1'
					}
				];
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError);
			});
		});
	});
});
