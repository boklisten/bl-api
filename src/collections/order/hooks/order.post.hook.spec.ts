import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {BlError, Branch, Order, UserDetail, AccessToken} from "@wizardcoder/bl-model";
import {OrderValidator} from "../helpers/order-validator/order-validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {orderSchema} from "../order.schema";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {OrderHookBefore} from "./order-hook-before";
import {OrderPostHook} from "./order.post.hook";

chai.use(chaiAsPromised);

describe('OrderPostHook', () => {
	const orderValidator: OrderValidator = new OrderValidator();
	const orderStorage: BlDocumentStorage<Order> = new BlDocumentStorage('orders', orderSchema);
	const userDetailStorage: BlDocumentStorage<UserDetail> = new BlDocumentStorage('userdetails', userDetailSchema);
	const orderHookBefore: OrderHookBefore = new OrderHookBefore();
	const orderPostHook: OrderPostHook = new OrderPostHook(orderValidator, orderHookBefore, userDetailStorage, orderStorage);
	
	
	let testOrder: Order;
	let testUserDetails: UserDetail;
	let testAccessToken: AccessToken;
	let orderValidated: boolean;
	
	beforeEach(() => {
		testAccessToken = {
			iss: 'boklisten.co',
			aud: 'boklisten.co',
			iat: 123,
			exp: 123,
			sub: 'user1',
			username: 'b@a.com',
			permission: "customer",
			details: 'user1'
		};
		
		orderValidated = true;
		
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
			customer: 'customer1',
			amount: 400,
			orderItems: [
				{
					type: "buy",
					amount: 300,
					item: 'i1',
					title: 'signatur',
					taxRate: 0,
					taxAmount: 0,
					unitPrice: 300
				},
				{
					type: "rent",
					amount: 100,
					item: 'i1',
					title: 'signatur',
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
	
	sinon.stub(orderValidator, 'validate').callsFake((order: any) => {
		if (!orderValidated) {
			return Promise.reject(new BlError('not a valid order'));
		}
		return Promise.resolve(testOrder);
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
			return expect(orderPostHook.before({valid: false}))
				.to.eventually.be.rejectedWith(BlError, /not a valid order/);
		});
		
		it('should resolve if requestBody is valid', () => {
			return expect(orderHookBefore.validate({valid: true}))
				.to.eventually.be.fulfilled;
		});
	});
	describe('#after()', () => {
		
		it('should reject if accessToken is empty or undefined', (done) => {
			orderPostHook.after([testOrder]).catch((blError: BlError) => {
				expect(blError.getMsg()).to.contain('accessToken was not specified when trying to process order');
				done();
			});
		});

		context('when orderValidator rejects', () => {
			it('should reject if orderValidator.validate rejected with error', () => {
				orderValidated = false;
				
				testOrder.id = 'order1';
				return expect(orderPostHook.after([testOrder], testAccessToken))
					.to.eventually.be.rejectedWith(BlError, /not a valid order/);
			});
		});
		
		context('when orderValidator resolves', () => {
			it('should resolve with testOrder when orderValidator.validate is resolved', (done) => {
				orderValidated = true;
				testOrder.id = 'order1';
				
				orderPostHook.after([testOrder], testAccessToken).then((orders: Order[]) => {
					expect(orders.length).to.be.eql(1);
					expect(orders[0]).to.eql(testOrder);
					done();
				});
			});
		});
		
		it('should reject if order.placed is set to true', () => {
			testOrder.placed = true;
			
			return expect(orderPostHook.after([testOrder], testAccessToken))
				.to.be.rejectedWith(BlError, /order.placed is set to true on post of order/);
		});
	});
});