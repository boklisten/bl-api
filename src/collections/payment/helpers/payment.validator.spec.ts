import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {PaymentValidator} from "./payment.validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
chai.use(chaiAsPromised);
import {expect} from 'chai';
import {Payment, Order, BlError, Branch} from 'bl-model';

describe('PaymentValidator', () => {
	const orderStorage =  new BlDocumentStorage<Order>('orders');
	const paymentStorage = new BlDocumentStorage<Payment>('payments');
	const branchStorage = new BlDocumentStorage<Branch>('branches')
	const paymentValidator = new PaymentValidator(orderStorage, paymentStorage);
	
	let testBranch: Branch;
	let testPayment: Payment;
	let testOrder: Order;
	
	beforeEach(() => {
		testPayment = {
			id: 'payment1',
			method: 'later',
			order: 'order1',
			info: {},
			amount: 100,
			confirmed: false,
			customer: 'customer1',
			branch: 'branch1'
		};
		
		testOrder = {
			id: 'order1',
			amount: 100,
			customer: 'customer1',
			branch: 'branch1',
			orderItems: [],
			byCustomer: true
		};
		
		testBranch = {
			id: 'branch1',
			name: 'testBranch',
			type: 'school',
			root: true,
			items: [],
			openingHours: [],
			paymentInfo: {
				responsible: false,
				rentPeriods: [
					{
						type: "semester",
						maxNumberOfPeriods: 2,
						percentage: 0.5
					}
				],
				extendPeriods: [
					{
						type: "semester",
						price: 100,
						maxNumberOfPeriods: 1
					}
				],
				buyout: {
					percentage: 0.50
				},
				acceptedMethods: ['card']
			}
		}
	});
	
	
	
	sinon.stub(branchStorage, 'get').callsFake((id: string) => {
		if (id !== testBranch.id) {
			return Promise.reject(new BlError('not found').code(702));
		}
		return Promise.resolve(testBranch);
	});
	
	sinon.stub(orderStorage, 'get').callsFake((id: string) => {
		if (id !== testOrder.id) {
			return Promise.reject(new BlError('not found').code(702));
		}
		return Promise.resolve(testOrder);
	});
	
	describe('#validate()', () => {
		it('should reject if payment is undefined', () => {
			return expect(paymentValidator.validate(undefined))
				.to.eventually.be.rejectedWith(BlError, /payment is not defined/);
		});
		
		it('should reject if paymentMethod is not valid', () => {
			testPayment.method = 'something' as any;
			return expect(paymentValidator.validate(testPayment))
				.to.eventually.be.rejectedWith(BlError, /paymentMethod "something" not supported/);
		});
		
		/*
		
		it('should reject if branch is not found', () => {
			testPayment.branch = 'notFoundBranch';
			
			return expect(paymentValidator.validate(testPayment))
				.to.eventually.be.rejectedWith(BlError, /payment.branch "notFoundBranch" not found/);
		});
		*/
		
		it('should reject if order is not found', () => {
			testPayment.order = 'orderNotFound';
			
			return expect(paymentValidator.validate(testPayment))
				.to.be.rejectedWith(BlError, /payment.order "orderNotFound" not found/);
		});
		
		context('when paymentMethod is "dibs"', () => {
			it('should reject if order.amount is not equal to payment.amount', () => {
				testOrder.amount = 300;
				testPayment.amount = 100;
				testPayment.method = 'dibs';
				
				return expect(paymentValidator.validate(testPayment))
					.to.be.rejectedWith(BlError, /order.amount "300" is not equal to payment.amount "100"/);
			});
		
		});
		
		context('when paymentMethod is "later"', () => {
		
		});
	});
});