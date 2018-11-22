import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Branch, Delivery, Order, OrderItem, Payment, UserDetail} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {OrderEmailHandler} from "./order-email-handler";
import {EmailHandler, EmailLog, EmailTemplateInput} from "@wizardcoder/bl-email";
import {EMAIL_SETTINGS} from "../email-settings";
import {isNullOrUndefined} from "util";
import * as moment from "moment";

chai.use(chaiAsPromised);

describe('OrderEmailHandler', () => {
	let testCustomerDetail: UserDetail;
	let testOrder: Order;
	let testPayment: Payment;
	let testDelivery: Delivery;
	let emailSendSuccessful: boolean;
	let standardTimeFormat = 'DD.MM.YYYY HH.mm.ss';
	let standardDayFormat = 'DD.MM.YYYY';
	const branchStorage = new BlDocumentStorage<Branch>('branches');
	const deliveryStorage = new BlDocumentStorage<Delivery>('deliveries');
	const paymentStorage = new BlDocumentStorage<Payment>('payments');
	const emailHandler = new EmailHandler({sendgrid: {apiKey: 'someKey'}});
	const orderEmailHandler = new OrderEmailHandler(emailHandler, deliveryStorage, paymentStorage, branchStorage);

	sinon.stub(deliveryStorage, 'get').callsFake((id: string) => {
		if (id !== testDelivery.id) {
			return Promise.reject(new BlError('delivery not found'));
		}

		return Promise.resolve(testDelivery);
	});

	let branchStorageGetStub = sinon.stub(branchStorage, 'get').returns(Promise.resolve({paymentInfo: {responsible: false}}));


	let paymentStorageStub = sinon.stub(paymentStorage, 'get').callsFake((id: string) => {
		if (id !== testPayment.id) {
			return Promise.reject(new BlError('payment not found'));
		}

		return Promise.resolve(testPayment);
	});

	let sendOrderReceiptStub = sinon.stub(emailHandler, 'sendOrderReceipt').callsFake(() => {
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

		context('emailHandler.sendOrderReceipt: emailSetting argument', () => {
			context('when one of the items have type rent', () => {

				beforeEach(() => {
					testOrder.orderItems = [
						{
							title: 'Some cool title',
							amount: 100,
							type: 'rent',
							info: {
								to: new Date()
							}
						} as OrderItem
					];

					testOrder.amount = testOrder.orderItems[0].amount;
					testOrder.branch = 'branchThatIsResponsible';

				});

				context('when user is under the age of 18', () => {
					let ages = [
						moment(new Date()).subtract(16, 'year').toDate(),
						moment(new Date()).subtract(1, 'day').toDate(),
						moment(new Date()).subtract(12, 'year').toDate(),
						moment(new Date()).subtract(18, 'year').add(1, 'day').toDate()
					];

					for (let age of ages) {
						it('should set withAgreement to true when user dob is ' + moment(age).format('DD.MM.YY'), (done) => {
							testCustomerDetail.dob = age;

							orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
								let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
								let withAgreement = sendOrderReceiptArguments[3];

								expect(withAgreement).to.be.true;

								done();
							}).catch((err) => {
								done(err);
							})
						});
					}
				});


				it('should set withAgreement to true when branch.responsible is set to true', (done) => {
					branchStorageGetStub.withArgs(testOrder.branch).returns(Promise.resolve({paymentInfo: {responsible: true}}));

					orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
						let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
						let withAgreement = sendOrderReceiptArguments[3];

						expect(withAgreement).to.be.true;

						done();
					}).catch((err) => {
						done(err);
					});
				});

				it('should send email to guardian if withAgreement is set and user is under 18', (done) => {
					//this ensures that with agreement is set to true
					branchStorageGetStub.withArgs(testOrder.branch).returns(Promise.resolve({paymentInfo: {responsible: true}}));
					testCustomerDetail.dob = moment(new Date()).subtract(16, 'year').toDate(),

					orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
						let sendOrderReceiptArguments = sendOrderReceiptStub.getCalls();

						let guardianEmailSetting = sendOrderReceiptArguments[sendOrderReceiptStub.getCalls().length - 2].args[0]; // the next to last call should be to the guardian

						expect(guardianEmailSetting.toEmail).to.be.eq(testCustomerDetail.guardian.email);

						done();
					}).catch((err) => {
						done(err);
					});

				});
			});

			context('when none of the items have type rent', () => {
				beforeEach(() => {
					testOrder.orderItems = [
						{
							title: 'Some cool title',
							amount: 100,
							type: 'buy',
						} as OrderItem
					];

					testOrder.amount = testOrder.orderItems[0].amount;
				});

				it('should not have withAgreement set to true even if user is under age of 18', (done) => {
					testCustomerDetail.dob = moment(new Date()).subtract(12, 'year').toDate();


					orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
						let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
						let withAgreement = sendOrderReceiptArguments[3];

						expect(withAgreement).to.be.false;

						done();
					}).catch((err) => {
						done(err);
					});
				});
			});
		});

		context('emailHandler.sendOrderReceipt: emailOrder argument', () => {

			it('should have item amount equal to order.amount', (done) => {
				let expectedAmount = '100';
				testOrder.amount = parseInt(expectedAmount);

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.itemAmount).to.be.eq(expectedAmount);

					done();
				}).catch((err) => {
					done(err);
				});
			});

			it('should have showPrice set to true when order.amount is not 0', (done) => {
				let expectedAmount = '120';
				testOrder.amount = parseInt(expectedAmount);

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.showPrice).to.be.eq(true);

					done();
				}).catch((err) => {
					done(err);
				});
			});

			it('should have showDeadline set to false if none of the items has type rent or extend', (done) => {
				testOrder.orderItems = [
					{
						title: 'Det vet da fåglarna',
						amount: 100,
						type: 'cancel',
					} as OrderItem,
					{
						title: 'Jokko mokko',
						amount: 100,
						type: 'return',
					} as OrderItem,

				];

				testOrder.amount = testOrder.orderItems[0].amount + testOrder.orderItems[1].amount;
				testOrder.delivery = null;
				testPayment.amount = testOrder.amount;

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.showDeadline).to.be.false;

					done();
				}).catch((err) => {
					done(err);
				})
			});



			it('should display item.amount if order.orderItem.amount is more than 0', (done) => {
				testOrder.orderItems = [
					{
						title: 'Det vet da fåglarna',
						amount: 100,
						type: 'rent',
						info: {
							to: new Date(2019, 1, 1)
						}
					} as OrderItem
				];

				testOrder.amount = testOrder.orderItems[0].amount;
				testOrder.delivery = null;
				testPayment.amount = testOrder.amount;

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.items[0].title).to.be.eq(testOrder.orderItems[0].title);
					expect(emailOrder.items[0].price).to.be.eq(testOrder.orderItems[0].amount.toString());
					expect(emailOrder.items[0].deadline).to.be.eq(moment(testOrder.orderItems[0].info.to).format(standardDayFormat));

					done();
				}).catch((err) => {
					done(err);
				})
			});

			it('should not display item.amount if order.orderItem.amount is 0 or undefined', (done) => {
				testOrder.orderItems = [
					{
						title: 'Det vet da fåglarna 2',
						amount: 0,
						type: 'rent',
						info: {
							to: new Date(2019, 1, 1)
						}
					} as OrderItem,
					{
						title: 'Jesus Christ in da house',
						amount: null,
						type: 'rent',
						info: {
							to: new Date(2019, 1, 1)
						}
					} as OrderItem
				];

				testOrder.amount = testOrder.orderItems[0].amount + testOrder.orderItems[1].amount;
				testOrder.delivery = null;
				testPayment.amount = testOrder.amount;

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.items[0].title).to.be.eq(testOrder.orderItems[0].title);
					expect(emailOrder.items[0].price).to.be.null;
					expect(emailOrder.items[0].deadline).to.be.eq(moment(testOrder.orderItems[1].info.to).format(standardDayFormat));

					expect(emailOrder.items[1].title).to.be.eq(testOrder.orderItems[1].title);
					expect(emailOrder.items[1].price).to.be.null;
					expect(emailOrder.items[1].deadline).to.be.eq(moment(testOrder.orderItems[1].info.to).format(standardDayFormat));


					done();
				}).catch((err) => {
					done(err);
				})
			});

			it('should only show title and status if orderItem.type is return', (done) => {
				testOrder.orderItems = [
					{
						title: 'Det vet da fåglarna 2',
						amount: 0,
						type: 'return',
						info: {
							to: new Date(2019, 1, 1)
						}
					} as OrderItem
				];

				testOrder.amount = testOrder.orderItems[0].amount;
				testOrder.delivery = null;
				testPayment.amount = testOrder.amount;

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.items[0].title).to.be.eq(testOrder.orderItems[0].title);
					expect(emailOrder.items[0].status).to.be.eq('returnert');
					expect(emailOrder.items[0].price).to.be.null;
					expect(emailOrder.items[0].deadline).to.be.null;

					done();
				}).catch((err) => {
					done(err);
				})
			});

			it('should have not have a delivery object when order.delivery is not defined', (done) => {
				let expectedAmount = '540';

				testOrder.amount = parseInt(expectedAmount);
				testOrder.delivery = undefined;

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {

					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.delivery).to.be.null;
					expect(emailOrder.showDelivery).to.be.false;
					expect(emailOrder.totalAmount).to.be.eq(expectedAmount);

					done();
				}).catch((err) => {
					done(err);
				});
			});

			it('should have a delivery object when order.delivery is present and have method "bring"', (done) => {

				testOrder.delivery = 'delivery1';
				testDelivery.method = 'bring';
				let expectedAmount = testOrder.amount + testDelivery.amount;

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {

					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					//delivery address should be on the form:
					// Billy Bob, Trondheimsveien 10 D, 0560 OSLO
					let expectedAddress = testDelivery.info['shipmentAddress'].name;
					expectedAddress += ', ' + testDelivery.info['shipmentAddress'].address;
					expectedAddress += ', ' + testDelivery.info['shipmentAddress'].postalCode;
					expectedAddress += ' ' + testDelivery.info['shipmentAddress'].postalCity;

					expect(emailOrder.delivery).to.be.eql({
						method: testDelivery.method,
						amount: testDelivery.amount,
						currency: 'NOK',
						address: expectedAddress,
						estimatedDeliveryDate: moment(testDelivery.info['estimatedDelivery']).format('DD.MM.YYYY')
					});

					expect(emailOrder.showDelivery).to.be.true;
					expect(emailOrder.totalAmount).to.be.eq(expectedAmount);

					done();
				}).catch((err) => {
					done(err);
				});
			});

			it('should not have a delivery object if delivery.method is not "bring"', (done) => {
				testOrder.delivery = 'delivery1';
				testDelivery.method = 'branch';

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1];

					expect(emailOrder.showDelivery).to.be.false;
					expect(emailOrder.delivery).to.be.null;

					done();
				}).catch((err) => {
					done(err);
				});
			});

			it('should have a payment object when the order includes payment type "dibs"', (done) => {
				testOrder.payments = [testPayment.id];
				let expectedTotal = testPayment.amount;

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1]; //second arg is the emailOrder

					expect(emailOrder.showPayment).to.be.true;
					expect(emailOrder.payment.total).to.be.eq(expectedTotal);
					expect(emailOrder.payment.currency).to.be.eq(testPayment.info['orderDetails'].currency);

					expect(emailOrder.payment.payments[0].method).to.be.eq(testPayment.info['paymentDetails']['paymentMethod']);
					expect(emailOrder.payment.payments[0].amount).to.be.eq((testPayment.info['orderDetails']['amount']/100).toString()); // the amount is in ears when it comes from dibs
					expect(emailOrder.payment.payments[0].cardInfo).to.be.eq('***' + '0079'); // should only send the last 4 digits
					expect(emailOrder.payment.payments[0].taxAmount).to.be.eq(testPayment.taxAmount.toString());
					expect(emailOrder.payment.payments[0].paymentId).to.be.eq(testPayment.info['paymentId']);
					expect(emailOrder.payment.payments[0].status).to.be.eq('bekreftet');
					expect(emailOrder.payment.payments[0].creationTime).to.be.eq(moment(testPayment.creationTime).format(standardTimeFormat));

					done();
				}).catch((err) => {
					done(err);
				});
			});

			it('should have a payment object that includes all the payments in order', (done) => {
				let payments: Payment[] = [
					{
						id: 'payment2',
						method: 'cash',
						order: 'order1',
						amount: 100,
						customer: 'customer1',
						branch: 'branch1',
						taxAmount: 0,
						confirmed: true,
						creationTime: new Date(2001, 1, 1)
					},
					{
						id: 'payment3',
						method: 'card',
						order: 'order1',
						amount: 400,
						customer: 'customer1',
						branch: 'branch1',
						taxAmount: 0,
						confirmed: true,
						creationTime: new Date(1900, 1, 2)
					}
				];


				testOrder.amount = payments[0].amount + payments[1].amount;
				testOrder.payments = [payments[0].id, payments[1].id];

				paymentStorageStub.withArgs(payments[0].id).returns(Promise.resolve(payments[0]));
				paymentStorageStub.withArgs(payments[1].id).returns(Promise.resolve(payments[1]));

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1]; //second arg is the emailOrder

					expect(emailOrder.payment.total).to.be.eq(testOrder.amount);
					expect(emailOrder.payment.currency).to.be.eq('NOK');
					expect(emailOrder.payment.taxAmount).to.be.eq(payments[0].taxAmount + payments[1].taxAmount);

					expect(emailOrder.payment.payments[0].method).to.be.eq(payments[0].method);
					expect(emailOrder.payment.payments[0].amount).to.be.eq(payments[0].amount.toString());
					expect(emailOrder.payment.payments[0].taxAmount).to.be.eq(payments[0].taxAmount.toString());
					expect(emailOrder.payment.payments[0].paymentId).to.be.eq(payments[0].id);
					expect(emailOrder.payment.payments[0].status).to.be.eq('bekreftet');
					expect(emailOrder.payment.payments[0].creationTime).to.be.eq(moment(payments[0].creationTime).format('DD.MM.YYYY HH.mm.ss'));

					expect(emailOrder.payment.payments[1].method).to.be.eq(payments[1].method);
					expect(emailOrder.payment.payments[1].amount).to.be.eq(payments[1].amount.toString());
					expect(emailOrder.payment.payments[1].taxAmount).to.be.eq(payments[1].taxAmount.toString());
					expect(emailOrder.payment.payments[1].paymentId).to.be.eq(payments[1].id);
					expect(emailOrder.payment.payments[1].status).to.be.eq('bekreftet');
					expect(emailOrder.payment.payments[1].creationTime).to.be.eq(moment(payments[1].creationTime).format('DD.MM.YYYY HH.mm.ss'));

					done();
				}).catch((err) => {
					done(err);
				});
			});

			it('should have showPayment set to false when there are no payments in order', (done) => {
				testOrder.payments = [];

				orderEmailHandler.sendOrderReceipt(testCustomerDetail, testOrder).then(() => {
					let sendOrderReceiptArguments = sendOrderReceiptStub.lastCall.args;
					let emailOrder = sendOrderReceiptArguments[1]; // second arg is the emailOrder

					expect(emailOrder.showPayment).to.be.false;
					expect(emailOrder.payment).to.be.null;

					done();
				}).catch((err) => {
					done(err);
				});
			});
		});


	});



	beforeEach(() => {
		emailSendSuccessful = true;

		testCustomerDetail = {
			id: 'customer1',
			email: 'customer@test.com',
			dob: new Date(1993, 1, 1),
			address: 'Traktorveien 10 D',
			postCity: 'Trondheim',
			postCode: '7070',
			guardian: {
				email: 'guardian@boklisten.co',
				name: 'Guardian McGuardiface',
				phone: '12345678'
			}
		} as UserDetail;

		testDelivery = {
			id: 'delivery1',
			order: 'order1',
			method: 'bring',
			info: {
				amount: 150,
				estimatedDelivery: new Date(),
				shipmentAddress: {
					name: 'Billy Bob',
					address: 'T town',
					postalCity: 'Trondheim',
					postalCode: '1234'
				}
			},
			amount: 150,
			taxAmount: 0
		};

		testPayment = {
			id: 'payment1',
			method: 'dibs',
			order: 'order1',
			amount: 250,
			taxAmount: 0,
			customer: 'customer1',
			branch: 'branch1',
			creationTime: new Date(),
			info : {
				"consumer" : {
					"privatePerson" : {
						"email" : "aholskil@gmail.com",
						"firstName" : "Andreas",
						"lastName" : "Holskil",
						"phoneNumber" : {
							"number" : "91804211",
							"prefix" : "+47"
						}
					},
					"shippingAddress" : {
						"addressLine1" : "Trondheimsveien 10",
						"addressLine2" : "",
						"city" : "OSLO",
						"country" : "NOR",
						"postalCode" : "0560"
					}
				},
				"created" : "2018-06-27T06:53:35.2829+00:00",
				"orderDetails" : {
					"amount" : 25000,
					"currency" : "NOK",
					"reference" : "5b33346ba8d009002fbb599f"
				},
				"paymentDetails" : {
					"cardDetails" : {
						"expiryDate" : "0145",
						"maskedPan" : "492500******0079"
					},
					"invoiceDetails" : {},
					"paymentMethod" : "Visa",
					"paymentType" : "CARD"
				},
				"paymentId" : "603b1b8046064035a55d68b07426f8a8",
				"summary" : {
					"reservedAmount" : 25000
				}
			}
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
