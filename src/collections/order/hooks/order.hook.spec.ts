import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {OrderHook} from "./order.hook";
import {BlError, Branch, Order, UserDetail} from "bl-model";
import {OrderValidator} from "./order-validator/order-validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {orderSchema} from "../order.schema";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {OrderHookBefore} from "./order-hook-before";

chai.use(chaiAsPromised);


describe('OrderHook', () => {
	const orderValidator: OrderValidator = new OrderValidator();
	const orderStorage: BlDocumentStorage<Order> = new BlDocumentStorage('orders', orderSchema);
	const userDetailStorage: BlDocumentStorage<UserDetail> = new BlDocumentStorage('userdetails', userDetailSchema);
	const orderHookBefore: OrderHookBefore = new OrderHookBefore();
	const orderHook: OrderHook = new OrderHook(orderValidator, orderHookBefore, userDetailStorage, orderStorage);
	
	
	let testOrder: Order;
	let testUserDetails: UserDetail;
	
	beforeEach(() => {
		testUserDetails = {
			id: 'user1',
			name: 'Olly Molly',
			email: 'a@b.com',
			phone: '',
			address: '',
			postCode: '',
			postCity: '',
			country: '',
			dob: new Date(),
			branch: 'branch1',
			orders: []
		};
		
		testOrder = {
			id: 'order1',
			amount: 400,
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
					amount: 100,
					item: 'i1',
					customerItem: 'ci1',
					title: 'signatur',
					rentRate: 0,
					taxRate: 0,
					taxAmount: 0,
					unitPrice: 300
				}
			],
			branch: 'b1',
			byCustomer: true,
			payments: [],
			delivery: '',
			comments: [],
			active: false,
			user: {
				id: 'u1'
			},
			lastUpdated: new Date(),
			creationTime: new Date()
		};
	});
		
	sinon.stub(orderStorage, 'get').callsFake((orderId: string) => {
		
		if (orderId !== 'order1' && orderId !== 'orderValid') {
			return Promise.reject(new BlError('not found').code(702));
		}
		return Promise.resolve(testOrder);
		
	});
	
	describe('#before()', () => {
		sinon.stub(orderHookBefore, 'validate').callsFake((requestBody: any) => {
			return new Promise((resolve, reject) => {
				if (!requestBody['valid']) {
					return reject(new BlError('not a valid order').code(701));
				}
				resolve(true);
			});
		});
		
		it('should reject if requestBody is not valid', () => {
			return expect(orderHook.before({valid: false}))
				.to.eventually.be.rejectedWith(BlError, /not a valid order/);
		});
		
		it('should resolve if requestBody is valid', () => {
			return expect(orderHookBefore.validate({valid: true}))
				.to.eventually.be.fulfilled;
		});
	});

	describe('#after()', () => {
		it('should reject if userId is empty or undefined', (done) => {
			orderHook.after(['abc']).catch((blError: BlError) => {
				expect(blError.getMsg()).to.contain('userId was not specified when trying to process order');
				done();
			});
		});
		
		it('should reject if orderIds includes more than one id', () => {
			return expect(orderHook.after(['order1', 'order2'], 'user1'))
				.to.eventually.be.rejectedWith(BlError, /orderIds included more than one id/);
		});
		
		
		
		sinon.stub(orderValidator, 'validate').callsFake((order: any) => {
			if (order.id !== 'orderValid') {
				return Promise.reject(new BlError('not a valid order'));
			}
			return Promise.resolve(testOrder);
		});
		
		context('when orderValidator rejects', () => {
			it('should reject if orderValidator.validate rejected with error', () => {
				testOrder.id = 'orderNotValid';
				return expect(orderHook.after(['order1'], 'user1'))
					.to.eventually.be.rejectedWith(BlError, /not a valid order/);
			});
		});
		
		context('when orderValidator resolves', () => {
			it('should resolve with testOrder when orderValidator.validate is resolved', (done) => {
				testOrder.id = 'orderValid';
				
				orderHook.after(['orderValid'], 'user1').then((orders: Order[]) => {
					expect(orders.length).to.be.eql(1);
					expect(orders[0]).to.eql(testOrder);
					done();
				});
			});
		});
		
		context('when order is valid and order.placed is set to true', () => {
			sinon.stub(userDetailStorage, 'get').callsFake((id: string) => {
				if (id !== 'user1') {
					return Promise.reject(new BlError('not found').code(702));
				}
				return Promise.resolve(testUserDetails);
			});
			
			it('should reject if user already have the orderId in his userDetails.orders for some reason', (done) => {
				testOrder.placed = true;
				testOrder.id = 'orderValid';
				testUserDetails.orders = ['orderValid'];
				
				orderHook.after(['orderValid'], 'user1').catch((blError: BlError) => {
					expect(blError.getMsg()).to.contain('the order was already placed');
					done();
				});
			});
			
		 
		});
	});
});