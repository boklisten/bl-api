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
			delivery: 'delivery1',
			branch: 'b1',
			byCustomer: true,
			payments: ['payment1'],
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
		
		
		context('when order.placed is set to true', () => {
			let testPayment: Payment;
			let testDelivery: Delivery;
			
			beforeEach(() => {
				testOrder.placed = true;
				
				testPayment = {
					id: 'payment1',
					method: 'card',
					order: 'order1',
					info: {},
					amount: 450,
					confirmed: true,
					customer: 'customer1',
					branch: 'branch1'
				};
				
				
				testDelivery = {
					id: 'delivery1',
					method: 'branch',
					info: {},
					order: 'order1',
					amount: 0
				};
			});
			
			sinon.stub(paymentStorage, 'getMany').callsFake((ids: string[]) => {
				return new Promise((resolve, reject) => {
				    if (ids[0] !== 'payment1') {
				    	return reject(new BlError('not found').code(702));
					}
					resolve([testPayment]);
				});
			
			
			});
			
			sinon.stub(deliveryStorage, 'get').callsFake((id: string) => {
				return new Promise((resolve, reject) => {
				    if (id !== 'delivery1') {
				    	return reject(new BlError('not found').code(702));
					}
					
					resolve(testDelivery);
				});
			});
			
			it('should reject with error if delivery is not defined', () => {
				testOrder.delivery = null;
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.placed is set but delivery is undefined/);
			});
			
			it('should reject with error if payment is empty', () => {
				testOrder.payments = [];
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.placed is set but order.payments is empty or undefined/);
			});
			
			
			it('should reject with error if delivery is not found', () => {
				testOrder.delivery = 'notFoundDelivery';
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.placed is set but delivery was not found/);
			});
			
			it('should reject with error if delivery.order is not equal to order.id', () => {
				testDelivery.order = 'notAvalidOrder';
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.id is not equal to delivery.order/);
			});
			
			it('should reject with error if payments is not found', () => {
				testOrder.payments = ['notFound'];
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.payments is not found/);
			});
			
			it('should reject with error if payment.confirmed is false', () => {
				testPayment.confirmed = false;
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /payment is not confirmed/);
			});
			
			it('should reject with error if total amount in payments is not equal to order.amount', () => {
				testPayment.amount = 0;
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /total amount of payments is not equal to order.amount/);
			});
			
			it('should reject with error if total amount in order.orderItems + delivery.amount is not equal to order.amount', () => {
				testDelivery.amount = 100;
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /total of order.orderItems amount \+ delivery.amount is not equal to order.amount/);
			});
			
		});
		
		
		
		
		
	});
});
