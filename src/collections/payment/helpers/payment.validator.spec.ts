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
	
	beforeEach(() => {
		testPayment = {
			id: 'payment1',
			method: 'later',
			order: 'order1',
			info: {},
			amount: 100,
			confirmed: false,
			customer: 'user1',
			branch: 'branch1'
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
		if (id !== 'branch1') {
			return Promise.reject(new BlError('not found').code(702));
		}
		return Promise.resolve(testBranch);
	});
	
	describe('#validate()', () => {
		it('should reject if payment is undefined', () => {
			return expect(paymentValidator.validate(undefined))
				.to.eventually.be.rejectedWith(BlError, /payment is not defined/);
		});
		
		it('should reject if paymentMethod is not valid', () => {
			return expect(paymentValidator.validate({method: 'something'} as any))
				.to.eventually.be.rejectedWith(BlError, /paymentMethod "something" not supported/);
		});
		
		it('should reject if branch is not found', () => {
			testPayment.branch = 'notFoundBranch';
			
			return expect(paymentValidator.validate(testPayment))
				.to.eventually.be.rejectedWith(BlError, /payment.branch "notFoundBranch" not found/);
		});
		
		context('when paymentMethod is "dibs"', () => {
		
		});
	});
});