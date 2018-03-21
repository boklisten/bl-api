import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, AccessToken, UserDetail, Order} from 'bl-model';
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
	
	beforeEach(() => {
		testRequestBody = {
			placed: true
		};
		
		orderUpdated = true;
		orderValidated = false;
		
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
			details: 'userDetails1'
		};
	});
	
	
	sinon.stub(orderStorage, 'get').callsFake((id: string) =>  {
		if (id !== testOrder.id) {
			return Promise.reject(new BlError('not found').code(702));
		}
		return Promise.resolve(testOrder);
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
		});
	});
});