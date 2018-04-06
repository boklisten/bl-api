import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, AccessToken, UserDetail, Order} from '@wizardcoder/bl-model';
import {OrderPatchHook} from "./order.patch.hook";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {OrderValidator} from "../helpers/order-validator/order-validator";

chai.use(chaiAsPromised);

describe('OrderPatchHook', () => {
	const userDetailStorage = new BlDocumentStorage<UserDetail>('userdetails');
	const orderStorage = new BlDocumentStorage<Order>('orders');
	const orderValidator = new OrderValidator();
	const orderPatchHook = new OrderPatchHook(userDetailStorage, orderStorage, orderValidator);
	
	let testAccessToken: AccessToken;
	let testRequestBody: any;
	let testOrder: Order;
	let orderUpdated = true;
	let orderValidated = true;
	let userDetailUpdated = true;
	let testUserDetail: UserDetail;
	
	beforeEach(() => {
		testRequestBody = {
			placed: true
		};
		
		orderUpdated = true;
		orderValidated = true;
		userDetailUpdated = true;
		
		testUserDetail = {
			id: 'userDetail1',
			name: 'albert',
			email: 'bill@b.com',
			phone: '1241234',
			address: '',
			postCode: '123',
			postCity: 'oslo',
			country: 'norway',
			dob: new Date(),
			branch: 'branch1',
			orders: []
		};
		
		testOrder = {
			id: 'order1',
			amount: 100,
			orderItems: [],
			branch: 'branch1',
			customer: 'customer1',
			byCustomer: true,
			placed: false
		};
		
		testAccessToken = {
			iss: 'boklisten.no',
			aud: 'boklisten.no',
			iat: 123,
			exp: 123,
			sub: 'user1',
			username: 'billy@bob.com',
			permission: "customer",
			details: 'userDetail1'
		};
	});
	
	
	sinon.stub(orderStorage, 'get').callsFake((id: string) =>  {
		if (id !== testOrder.id) {
			return Promise.reject(new BlError('not found').code(702));
		}
		return Promise.resolve(testOrder);
	});
	
	const userDetailStorageUpdateStub = sinon.stub(userDetailStorage, 'update').callsFake((id: string, data: any, user: any) => {
		if (!userDetailUpdated) {
			return Promise.reject(new BlError('could not update'));
		}
		
		if (data['orders']) {
			testUserDetail.orders = data['orders'];
		}
		
		return Promise.resolve(true);
	});
	
	sinon.stub(userDetailStorage, 'get').callsFake((id: string) => {
		if (id !== testUserDetail.id) {
			return Promise.reject(new BlError('not found').code(702));
		}
		return Promise.resolve(testUserDetail);
	});
	
	const orderStorageUpdateStub = sinon.stub(orderStorage, 'update').callsFake((id: string, data: any, user: any) => {
		if (!orderUpdated) {
			return Promise.reject('could not update');
		}
		return Promise.resolve(testOrder);
	});
	
	const orderValidationValidateStub = sinon.stub(orderValidator, 'validate').callsFake((order: Order) => {
		if (!orderValidated) {
			return Promise.reject(new BlError('could not validate'));
		}
		return Promise.resolve(true);
	});
	
	
	describe('before()', () => {
		it('should reject if body is empty or undefined', () => {
			return expect(orderPatchHook.before(undefined, testAccessToken, 'order1'))
				.to.be.rejectedWith(BlError, /body not defined/);
		});
		
		it('should reject if accessToken is empty or undefined', () => {
			return expect(orderPatchHook.before({placed: true}, undefined, 'order1'))
				.to.be.rejectedWith(BlError, /accessToken not defined/);
		});
		
		it('should reject if id is not defined', () => {
			return expect(orderPatchHook.before(testRequestBody, testAccessToken, null))
				.to.be.rejectedWith(BlError, /id not defined/);
		});
	});
	
	describe('after()', () => {
		it('should reject if there are more than one id', () => {
			return expect(orderPatchHook.after(['order1', 'order2'], testAccessToken))
				.to.be.rejectedWith(BlError, /can only patch one order at a time/);
		});
		
		it('should reject if accessToken is not defined', () => {
			return expect(orderPatchHook.after(['order1'], undefined))
				.to.be.rejectedWith(BlError, /accessToken not defined/);
		});
		
		it('should reject if order is not found', () => {
			return expect(orderPatchHook.after(['notFoundOrder'], testAccessToken))
				.to.be.rejectedWith(BlError, /order "notFoundOrder" not found/);
		});
		
		context('when order.placed is true', () => {
			it('should set order.placed to false if orderValidation.validate rejects', (done) => {
				orderValidated = false;
				testOrder.placed = true;
				
				orderPatchHook.after(['order1'], testAccessToken).catch((blError: BlError) => {
					expect(orderStorageUpdateStub.calledWith([{placed: false}]));
					done();
				});
			});
			
			it('should create userDetail.orders array with the orderId if it was not declared', (done) => {
				testOrder.placed = true;
				testUserDetail.orders = null;
				
				orderPatchHook.after(['order1'], testAccessToken).then(() => {
					expect(testUserDetail.orders).to.be.eql(['order1']);
					done();
				});
			});
			
			it('should update userDetail.orders array with the newly placed order', () => {
				testOrder.placed = true;
				testOrder.id = 'order1';
				testUserDetail.orders = ['order2', 'order3'];
				
				orderPatchHook.after(['order1'], testAccessToken).then(() => {
					expect(testUserDetail.orders).to.be.eql(['order2', 'order3', 'order1']);
				});
			});
			
			it('should reject if userDetail.orders array already includes the new orderId', () => {
				testOrder.placed = true;
				testOrder.id = 'order1';
				testUserDetail.orders = ['order1', 'order2'];
				
				return expect(orderPatchHook.after(['order1'], testAccessToken))
					.to.be.rejectedWith(BlError, /order.id "order1" is already in userDetail.orders/);
			});
		});
	});
});