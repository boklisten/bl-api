import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Order, OrderItem, CustomerItem, Payment, AccessToken, UserDetail} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {OrderPlacedHandler} from "./order-placed-handler";
import {PaymentHandler} from "../../../payment/helpers/payment-handler";

chai.use(chaiAsPromised);

describe('OrderPlacedHandler', () => {
	let testOrder: Order;
	let testPayment: Payment;
	let paymentsConfirmed: boolean;
	let testAccessToken: AccessToken;
	let orderUpdate: boolean;
	let testUserDetail: UserDetail;
	let userDeatilUpdate: boolean;
	
	const customerItemStorage = new BlDocumentStorage<CustomerItem>('customeritems');
	const orderStorage = new BlDocumentStorage<Order>('orders');
	const paymentHandler = new PaymentHandler();
	const userDetailStorage = new BlDocumentStorage<UserDetail>('userdetails');
	const orderPlacedHandler = new OrderPlacedHandler(customerItemStorage, orderStorage, paymentHandler, userDetailStorage);
	
	sinon.stub(customerItemStorage, 'add').callsFake((customerItem: CustomerItem) => {
		if (customerItem.item === 'item1') {
			customerItem.id = 'customerItem1';
			return Promise.resolve(customerItem);
		} else if (customerItem.item === 'item2') {
			customerItem.id = 'customerItem2';
			return Promise.resolve(customerItem)
		} else {
			return Promise.reject('could not add doc');
		}
	});
	
	sinon.stub(userDetailStorage, 'get').callsFake((id: string) => {
		if (id !== testUserDetail.id) {
			return Promise.reject(new BlError('not found'));
		}
		
		return Promise.resolve(testUserDetail);
	});
	
	sinon.stub(userDetailStorage, 'update').callsFake((id: string, data: any) => {
		if (userDeatilUpdate) {
			if (data['orders']) {
				testUserDetail.orders = data['orders'];
				return Promise.resolve(testUserDetail);
			}
		}
		return Promise.reject(new BlError('could not update user details'));
	});
	
	sinon.stub(paymentHandler, 'confirmPayments').callsFake((ids: string[]) => {
		if (!paymentsConfirmed) {
			return Promise.reject(new BlError('could not confirm orders'));
		}
		
		return Promise.resolve([testPayment]);
	});
	
	sinon.stub(orderStorage, 'update').callsFake((id: string, data: any) => {
		if (!orderUpdate) {
			return Promise.reject(new BlError('could not update'))
		}
		return Promise.resolve(testOrder);
	});
	
	beforeEach(() => {
		paymentsConfirmed = true;
		orderUpdate = true;
		userDeatilUpdate = true;
		
		testOrder = {
			id: 'branch1',
			amount: 100,
			orderItems: [
				{
					type: "rent",
					item: 'item2',
					title: 'Signatur 3: Tekstsammling',
					amount: 50,
					unitPrice: 100,
					taxRate: 0.5,
					taxAmount: 25,
					info: {
						from: new Date(),
						to: new Date(),
						numberOfPeriods: 1,
						periodType: "semester"
					}
				}
			],
			branch: 'branch1',
			customer: 'customer1',
			byCustomer: true,
			placed: true,
			payments: [],
			delivery: 'delivery1'
		};
		
		testPayment = {
			id: 'payment1',
			method: 'dibs',
			order: 'order1',
			amount: 200,
			customer: 'customer1',
			branch: 'branch1',
			taxAmount: 0,
			info: {
				paymentId: 'dibsEasyPayment1'
			}
		};
		
		testAccessToken = {
			iss: 'boklisten.co',
			aud: 'boklisten.co',
			iat: 1,
			exp: 1,
			sub: 'userDetail1',
			permission: 'customer',
			details: 'userDetail1',
			username: 'user@name.com'
		};
		
		testUserDetail = {
			id: 'customer1',
			name: '',
			email: '',
			phone: '',
			address: '',
			postCode: '',
			postCity: '',
			country: '',
			dob: new Date(),
			branch: 'branch1',
		}
	});

	describe('#placeOrder()', () => {
		it('should reject if order could not be updated with confirm true', () => {
			orderUpdate = false;
			
			return expect(orderPlacedHandler.placeOrder(testOrder, testAccessToken))
				.to.be.rejectedWith(BlError, /order could not be updated/);
		});
		
		it('should reject if paymentHandler.confirmPayments rejects', () => {
			paymentsConfirmed = false;
			
			return expect(orderPlacedHandler.placeOrder(testOrder, testAccessToken))
				.to.be.rejectedWith(BlError, /order.payments could not be confirmed/);
		});
		
		it('should reject if order.customer is not found', () => {
			testOrder.customer = 'notFoundUserDetails';
			
			return expect(orderPlacedHandler.placeOrder(testOrder, testAccessToken))
				.to.be.rejectedWith(BlError, /customer "notFoundUserDetails" not found/);
		});
		
		it('should reject if userDetailStorage.updates rejects', () => {
			userDeatilUpdate = false;
			
			return expect(orderPlacedHandler.placeOrder(testOrder, testAccessToken))
				.to.be.rejectedWith(BlError, /could not update userDetail with placed order/);
		});
		
		it('should resolve when order was placed', () => {
			return expect(orderPlacedHandler.placeOrder(testOrder, testAccessToken))
				.to.be.fulfilled;
		});
	
	});
	
});