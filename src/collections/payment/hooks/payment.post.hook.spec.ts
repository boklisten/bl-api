import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {Payment, Order, BlError, AccessToken} from '@wizardcoder/bl-model';
import {PaymentPostHook} from "./payment.post.hook";
import {PaymentValidator} from "../helpers/payment.validator";
import {PaymentDibsHandler} from "../helpers/dibs/payment-dibs-handler";

chai.use(chaiAsPromised);

describe('PaymentPostHook', () => {
	const paymentValidator = new PaymentValidator();
	const orderStorage = new BlDocumentStorage<Order>('orders');
	const paymentStorage: BlDocumentStorage<Payment> = new BlDocumentStorage('payments');
	const paymentDibsHandler = new PaymentDibsHandler();
	const paymentPostHook = new PaymentPostHook(paymentStorage, orderStorage, paymentValidator, paymentDibsHandler);
	
	let testOrder: Order;
	let testPayment: Payment;
	let testAccessToken;
	let paymentValidated: boolean;
	let handleDibsPaymentValid: boolean;
	
	beforeEach(() => {
		testOrder = {
			id: 'order1',
			amount: 100,
			orderItems: [],
			branch: 'branch1',
			customer: 'customer1',
			byCustomer: true,
			payments: []
		};
		
		testPayment = {
			id: 'payment1',
			method: "later",
			order: 'order1',
			amount: 0,
			customer: 'customer1',
			branch: 'branch1'
		};
		
		testAccessToken = {
			sub: 'user1',
			permission: 'customer'
		};
		
		paymentValidated = true;
		handleDibsPaymentValid = true;
	});
	
	sinon.stub(paymentStorage, 'get').callsFake((id: string) => {
		if (id !== testPayment.id) {
			return Promise.reject(new BlError('not found').code(702));
		}
		
		return Promise.resolve(testPayment);
	});
	
	sinon.stub(paymentStorage, 'update').callsFake((id: string, data: any, accessToken: AccessToken) => {
		return Promise.resolve(testPayment);
	});
	
	sinon.stub(paymentDibsHandler, 'handleDibsPayment').callsFake((payment, accessToken) => {
		if (!handleDibsPaymentValid) {
			return Promise.reject(new BlError('could not create dibs payment'));
		}
		return Promise.resolve(testPayment);
	});
	
	sinon.stub(orderStorage, 'get').callsFake((id: string) => {
		if (id !== testOrder.id) {
			return Promise.reject(new BlError('not found').code(702));
		}
		
		return Promise.resolve(testOrder);
	});
	
	const orderStorageUpdateStub = sinon.stub(orderStorage, 'update').callsFake((id: string, data: any) => {
		return Promise.resolve(testOrder);
	});
	
	sinon.stub(paymentValidator, 'validate').callsFake(() => {
		if (!paymentValidated) {
			return Promise.reject(new BlError('could not validate payment'));
		}
		
		return Promise.resolve(true);
	});
	
	describe('#before()', () => {
	
	});
	
	describe('#after()', () => {
		it('should reject if ids is empty or undefined', () => {
			return expect(paymentPostHook.after([], testAccessToken))
				.to.eventually.be.rejectedWith(BlError, /ids is empty or undefined/);
		});
		
		it('should reject if accessToken is undefined', () => {
			return expect(paymentPostHook.after(['payment1'], undefined))
				.to.eventually.be.rejectedWith(BlError, /accessToken is undefined/);
		});
		
		it('should reject when the paymentId is not found', () => {
			return expect(paymentPostHook.after(['notFoundPayment'], testAccessToken))
				.to.eventually.be.rejectedWith(BlError, /payment id not found/);
		});
		
		it('should reject if paymentValidator.validate rejects', () => {
			paymentValidated = false;
			
			return expect(paymentPostHook.after(['payment1'], testAccessToken))
				.to.be.rejectedWith(BlError, /payment could not be validated/);
		});
		
		context('when paymentMethod is "later"', () => {
			it('should reject if order.payments includes more than one payment', () => {
				testOrder.payments = ['payment2', 'payment3'];
				
				return expect(paymentPostHook.after(['payment1'], testAccessToken))
					.to.eventually.be.rejectedWith(BlError, /there is more than one payment in order.payments/);
			});
			
			it('should set order.payments to include the posted payment', (done) => {
				testOrder.payments = [];
				
				paymentPostHook.after(['payment1'], testAccessToken).then(() => {
					
					expect(orderStorageUpdateStub.getCall(0).args)
						.to.be.eql(['order1', {payments: ['payment1']}, {id: testAccessToken.sub, permission: testAccessToken.permission}]);
					
					done();
				});
			});
		});
		
		context('when paymentMethod is "dibs"', () => {
			beforeEach(() => {
				testPayment.method = 'dibs';
			});
			
			it('should reject if paymentDibsHandler.handleDibsPayment rejects', () => {
				handleDibsPaymentValid = false;
				
				return expect(paymentPostHook.after(['payment1'], testAccessToken))
					.to.be.rejectedWith(BlError, /could not create dibs payment/);
			});
		});
	});
});