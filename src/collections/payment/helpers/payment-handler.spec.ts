import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {AccessToken, BlError, Order, Payment} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {PaymentHandler} from "./payment-handler";
import {DibsPaymentService} from "../../../payment/dibs/dibs-payment.service";
import {DibsEasyPayment} from "../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import {UserDetailHelper} from "../../user-detail/helpers/user-detail.helper";

chai.use(chaiAsPromised);

describe('PaymentHandler', () => {
	let testPayments: Payment[];
	let testPayment1: Payment;
	let testPayment2: Payment;
	let testOrder: Order;
	let testAccessToken: AccessToken;
	let userDetailHelperDibsPaymentUpdateSuccess: boolean;
	const paymentStorage = new BlDocumentStorage<Payment>('payments');
	const dibsPaymentService = new DibsPaymentService();
	const userDetailHelper = new UserDetailHelper();
	const paymentHandler = new PaymentHandler(paymentStorage, dibsPaymentService, userDetailHelper);

	beforeEach(() => {
		testOrder = {
			id: 'order1',
			amount: 200,
			orderItems: [],
			branch: 'branch1',
			customer: 'customer1',
			byCustomer: true,
			payments: ['payment1'],
			delivery: 'delivery1'
		};
		
		testPayment1 = {
			id: 'payment1',
			method: 'dibs',
			order: 'order1',
			amount: 200,
			customer: 'customer1',
			branch: 'branch1',
			info: {
				paymentId: 'dibsEasyPayment1'
			}
		};
		
		testPayment2 = {
			id: 'payment2',
			method: 'later',
			order: 'order1',
			amount: 200,
			customer: 'customer1',
			branch: 'branch1',
			info: {}
		};
		
		testAccessToken = {
			iss: 'boklisten.co',
			aud: 'boklisten.co',
			iat: 1,
			exp: 1,
			sub: 'user1',
			username: 'user@name.com',
			permission: 'customer',
			details: 'userDetails1'
		}

		userDetailHelperDibsPaymentUpdateSuccess = true;
	});
	
	
	
	sinon.stub(paymentStorage, 'getMany').callsFake((ids: string[]) => {
		let payments = [];
		if (!ids || ids.length <= 0) {
			return Promise.reject(new BlError('ids undefined'));
		}
		for (const id of ids) {
			if (id === testPayment1.id) {
				payments.push(testPayment1)
			} else if (id === testPayment2.id) {
				payments.push(testPayment2);
			} else {
				return Promise.reject(new BlError('not found'));
			}
		}
		
		return Promise.resolve(payments);
	});
	
	sinon.stub(paymentStorage, 'update').callsFake((id: string, data: any) => {
		if (id == testPayment1.id) {
			if (data['confirmed']) {
				testPayment1.confirmed = data['confirmed'];
			}
			return Promise.resolve(testPayment1);
		} else if (id === testPayment2.id) {
			if (data['confirmed']) {
				testPayment2.confirmed = data['confirmed'];
			}
			return Promise.resolve(testPayment2)
		} else {
			return Promise.reject('not found');
		}
	});

	sinon.stub(userDetailHelper, 'updateUserDetailBasedOnDibsEasyPayment').callsFake((userDetailId: string, dibsEasyPayment: DibsEasyPayment, accessToken: any) => {
		if (!userDetailHelperDibsPaymentUpdateSuccess) {
			return Promise.reject(new BlError('could not update userDetail'));
		}

		return Promise.resolve(true);
	});
	
	describe('confirmPayments()', () => {
		it('should reject if payments in order is not found', () => {
			testOrder.payments = ['paymentNotFound'];
			
			return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
				.to.be.rejectedWith(BlError, /one or more payments was not found/);
		});
		
		it('should reject if one of the payments is already confirmed', () => {
			testOrder.payments = ['payment1'];
			
			testPayment1.confirmed = true;
			
			return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
				.to.be.rejectedWith(BlError, /payment "payment1" is already confirmed/);
		});
		
		it('should reject if there are multiple payments and one of them has method "dibs"', () => {
			testOrder.payments = ['payment1', 'payment2'];
			testPayment1.method = 'dibs';
			testPayment2.method = 'dibs';
			
			return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
				.to.be.rejectedWith(BlError, /there was multiple payments but only one is allowed if one has method "dibs"/);
		});
		
		describe('when paymentMethod is "dibs"', () => {
			let testDibsEasyPayment: DibsEasyPayment;
			
			beforeEach(() => {
				testDibsEasyPayment = {
					paymentId: 'dibsEasyPayment1',
					summary: {
						reservedAmount: 20000
					},
					consumer: {},
					orderDetails: {
						amount: 200,
						currency: 'NOK',
						reference: 'order1'
					},
					created: new Date().toISOString()
				};
				
				testPayment1.info = {
					paymentId: 'dibsEasyPayment1'
				}
			});
			
			sinon.stub(dibsPaymentService, 'fetchDibsPaymentData').callsFake((dibsPaymentId: string) => {
				if (dibsPaymentId !== testDibsEasyPayment.paymentId) {
					return Promise.reject(new BlError('could not get payment'));
				}
				return Promise.resolve(testDibsEasyPayment);
			});
			
			it('should reject if payment.info.paymentId is not defined', () => {
				testPayment1.info = {
					paymentId: undefined
				};
				
				return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
					.to.be.rejectedWith(BlError, /payment.method is "dibs" but payment.info.paymentId is undefined/);
			});
			
			it('should reject if payment.info.paymentId is not found on dibs api', () => {
				testPayment1.info = {
					paymentId: 'notFoundDibsEasyPayment'
				};
				
				return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
					.to.be.rejectedWith(BlError, /could not get dibs payment on dibs api/);
			});
			
			it('should reject if dibsEasyPayment.orderDetails.reference is not equal to order.id', () => {
				testDibsEasyPayment.orderDetails.reference = 'notAValidOrderId';
				
				return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
					.to.be.rejectedWith(BlError, /dibsEasyPayment.orderDetails.reference is not equal to order.id/);
			});
			
			it('should reject if summary is undefined', () => {
				testDibsEasyPayment.summary = undefined;
				
				return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
					.to.be.rejectedWith(BlError, /dibsEasyPayment.summary is undefined/);
			});
			
			it('should reject if summary.reservedAmount is undefined', () => {
				testDibsEasyPayment.summary = {};
				
				return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
					.to.be.rejectedWith(BlError, /dibsEasyPayment.summary.reservedAmount is undefined/);
			});
			
			it('should reject if summary.reservedAmount is not equal to payment.amount', () => {
				testDibsEasyPayment.summary = {
					reservedAmount: 10000
				};
				testPayment1.amount = 200;
				
				return expect(paymentHandler.confirmPayments(testOrder, testAccessToken))
					.to.be.rejectedWith(BlError, /dibsEasyPayment.summary.reservedAmount "10000" is not equal to payment.amount "20000"/);
			});
			
			it('should update payment with confirmed true if dibsEasyPayment is valid', (done) => {
				testPayment1.confirmed = false;
				
				paymentHandler.confirmPayments(testOrder, testAccessToken).then((payments: Payment[]) => {
					expect(payments[0].confirmed).to.be.true;
					done();
				});
			});
		});
	});
});