import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {AccessToken, BlError, Payment} from '@wizardcoder/bl-model';
import {PaymentPatchHook} from "./payment.patch.hook";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {PaymentDibsHandler} from "../helpers/dibs/payment-dibs-handler";
import {PaymentValidator} from "../helpers/payment.validator";

chai.use(chaiAsPromised);

describe('PaymentPatchHook', () => {
	const paymentDibsHandler = new PaymentDibsHandler();
	const paymentStorage = new BlDocumentStorage<Payment>('payments');
	const paymentValidator = new PaymentValidator();
	const paymentPatchHook = new PaymentPatchHook(paymentStorage, paymentDibsHandler, paymentValidator);
	
	let testPayment: Payment;
	
	let testAccessToken: AccessToken;
	let dibsPaymentCreated: boolean;
	let paymentValidated: boolean;
	
	beforeEach(() => {
		testAccessToken = {
			iss: '',
			aud: '',
			iat: 1,
			exp: 1,
			sub: 'user1',
			username: '',
			permission: "customer",
			details: ''
		};
		
		testPayment = {
			id: 'payment1',
			method: 'dibs',
			order: 'order1',
			amount: 200,
			customer: 'customer1',
			branch: 'branch1'
		};
		
		paymentValidated = true;
		dibsPaymentCreated = true;
	});
	
	sinon.stub(paymentStorage, 'get').callsFake((id: string) => {
		return (id === testPayment.id) ? Promise.resolve(testPayment) : Promise.reject(new BlError('not found'));
	});
	
	sinon.stub(paymentDibsHandler, 'handleDibsPayment').callsFake((payment, accessToken) => {
		return (dibsPaymentCreated) ? Promise.resolve(testPayment) : Promise.reject(new BlError('could not create dibs payment'));
	});
	
	sinon.stub(paymentValidator, 'validate').callsFake((valid) => {
		return (paymentValidated) ? Promise.resolve(true) : Promise.reject(new BlError('could not validate payment'));
	});
	
	
	
	describe('after()', () => {
		it('should reject if paymentValidator.validate rejects', () => {
			paymentValidated = false;
			
			return expect(paymentPatchHook.after([testPayment], testAccessToken))
				.to.be.rejectedWith(BlError, /could not validate payment/);
		});
		
		it('should resolve when given a valid payment', () => {
			return expect(paymentPatchHook.after([testPayment], testAccessToken))
				.to.be.fulfilled;
		});
		
		context('when payment.method is "dibs"', () => {
			 it('should reject if paymentDibsHandler.handleDibsPayment rejects', () => {
				 dibsPaymentCreated = false;
				 
				 return expect(paymentPatchHook.after([testPayment], testAccessToken))
					 .to.be.rejectedWith(BlError, /could not create dibs payment/);
			 });
		 });
		 
		 context('when payment.method is not valid', () => {
			 it('should reject with error', () => {
				 testPayment.method = 'something' as any;
				 
				 return expect(paymentPatchHook.after([testPayment], testAccessToken))
					 .to.be.rejectedWith(BlError, /payment.method "something" not supported/);
			 });
		 });
	});
});


































