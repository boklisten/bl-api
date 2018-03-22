import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlDocumentStorage} from "../../../../../storage/blDocumentStorage";
import {Payment, Delivery, Order, BlError} from 'bl-model';
import {OrderPlacedValidator} from "./order-placed-validator";
import * as sinon from 'sinon';

chai.use(chaiAsPromised);

describe('OrderPlacedValidator', () => {
	
	describe('#validate()', () => {
		
		
		let testOrder: Order;
		const paymentStorage: BlDocumentStorage<Payment> = new BlDocumentStorage('payments');
		
		const deliveryStorage: BlDocumentStorage<Delivery> = new BlDocumentStorage('deliveries');
		const orderPlacedValidator = new OrderPlacedValidator(deliveryStorage, paymentStorage);
		
		
		beforeEach(() => {
			testOrder = {
				id: 'order1',
				amount: 450,
				orderItems: [
					{
						type: "buy",
						amount: 300,
						item: 'i1',
						title: 'Signatur 3',
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 300
					},
					{
						type: "rent",
						amount: 150,
						item: 'i2',
						title: 'Signatur 4',
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 300,
					}
				],
				customer: 'customer1',
				delivery: 'delivery1',
				branch: 'b1',
				byCustomer: true,
				payments: ['payment1']
			};
		});
		
		context('when order.placed is set to false', () => {
			it('should resolve with true', () => {
				testOrder.placed = false;
				
				expect(orderPlacedValidator.validate(testOrder))
					.to.eventually.be.true;
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
					info: {
						branch: 'branch1'
					},
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
				
				return orderPlacedValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.placed is set but delivery is undefined/);
			});
			
			it('should reject with error if payment is empty', () => {
				testOrder.payments = [];
				
				return orderPlacedValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.placed is set but order.payments is empty or undefined/);
			});
			
			
			it('should reject with error if delivery is not found', () => {
				testOrder.delivery = 'notFoundDelivery';
				
				return orderPlacedValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.placed is set but delivery was not found/);
			});
			
			it('should reject with error if payments is not found', () => {
				testOrder.payments = ['notFound'];
				
				return orderPlacedValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /order.payments is not found/);
			});
			
			it('should reject with error if payment.confirmed is false', () => {
				testPayment.confirmed = false;
				
				return orderPlacedValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /payment is not confirmed/);
			});
			
			it('should reject with error if total amount in payments is not equal to order.amount', () => {
				testPayment.amount = 0;
				
				return orderPlacedValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /total amount of payments is not equal to order.amount/);
			});
			
			it('should reject with error if total amount in order.orderItems + delivery.amount is not equal to order.amount', () => {
				testDelivery.amount = 100;
				
				return orderPlacedValidator.validate(testOrder)
					.should.be.rejectedWith(BlError, /total of order.orderItems amount \+ delivery.amount is not equal to order.amount/);
			});
			
			it('should resolve if delivery and payments are valid according to order information', (done) => {
				
				orderPlacedValidator.validate(testOrder).then((resolved) => {
					expect(resolved).to.be.true;
					done();
				});
				
			});
			
		});
	});
});