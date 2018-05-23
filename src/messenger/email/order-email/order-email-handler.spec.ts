import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Delivery, Order, Payment, UserDetail} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {OrderEmailHandler} from "./order-email-handler";
import {EmailHandler, EmailLog, EmailTemplateInput} from "@wizardcoder/bl-email";
import {EMAIL_SETTINGS} from "../email-settings";

chai.use(chaiAsPromised);

describe('OrderEmailHandler', () => {
	let testCustomerDetail: UserDetail;
	let testOrder: Order;
	let testPayment: Payment;
	let testDelivery: Delivery;
	let emailSendSuccessful: boolean;
	const deliveryStorage = new BlDocumentStorage<Delivery>('deliveries');
	const paymentStorage = new BlDocumentStorage<Payment>('payments');
	const emailHandler = new EmailHandler({sendgrid: {apiKey: 'someKey'}});
	const orderEmailHandler = new OrderEmailHandler(emailHandler, deliveryStorage, paymentStorage);

	sinon.stub(deliveryStorage, 'get').callsFake((id: string) => {
		if (id !== testDelivery.id) {
			return Promise.reject(new BlError('delivery not found'));
		}

		return Promise.resolve(testDelivery);
	});

	sinon.stub(paymentStorage, 'get').callsFake((id: string) => {
		if (id !== testPayment.id) {
			return Promise.reject(new BlError('payment not found'));
		}

		return Promise.resolve(testPayment);
	});

	sinon.stub(emailHandler, 'sendOrderReceipt').callsFake((emailTemplateInput: EmailTemplateInput) => {
		if (!emailSendSuccessful) {
			return Promise.reject(new Error('could not send email'));
		}


		return Promise.resolve(true);
	});


	describe('sendOrderReceipt()', () => {
		it('should reject if emailHandler.sendOrderReceipt rejects', () => {
			emailSendSuccessful = false;

			return expect(orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder))
				.to.be.rejectedWith(Error, /could not send email/);
		});

		it('should resolve with EmailLog if emailHandler.sendWithAgreement resolves', () => {
			return expect(orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder))
				.to.be.fulfilled;
		});
	});



	beforeEach(() => {
		emailSendSuccessful = true;

		testCustomerDetail = {
			id: 'customer1',
			email: 'customer@test.com',
			dob: new Date(2000, 1, 1),
			address: 'Traktorveien 10 D',
			postCity: 'Trondheim',
			postCode: '7070'
		} as UserDetail;

		testDelivery = {
			id: 'delivery1',
			order: 'order1',
			method: 'bring',
			info: {
				amount: 150,
				estimatedDelivery: new Date()
			},
			amount: 150,
			taxAmount: 0
		};

		testPayment = {
			id: 'payment1',
			method: 'dibs',
			order: 'order1',
			amount: 250,
			customer: 'customer1',
			branch: 'branch1',
			info: {
				paymentId: 'dibsPayment1'
			},
			creationTime: new Date()
		};

		testOrder = {
			id: 'order1',
			creationTime: new Date(),
			amount: 100,
			delivery: 'delivery1',
			branch: 'branch',
			customer: 'customer1',
			byCustomer: false,
			payments: [
				'payment1'
			],
			orderItems: [
				{
					type: 'rent',
					item: 'item1',
					info: {
						from: new Date(),
						to: new Date(),
						numberOfPeriods: 1,
						periodType: 'semester'
					},
					title: 'Signatur 3',
					amount: 100,
					unitPrice: 100,
					taxRate: 0,
					taxAmount: 0
				}
			]
		}
	});
});