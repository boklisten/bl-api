import {EmailHandler, EmailLog} from "@wizardcoder/bl-email";
import {OrderItemType} from "@wizardcoder/bl-model/dist/order/order-item/order-item-type";
import {Delivery, Order, OrderItem, Payment, UserDetail, BlError} from "@wizardcoder/bl-model";
import {EMAIL_SETTINGS} from "../email-settings";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../../../collections/payment/payment.schema";
import {deliverySchema} from "../../../collections/delivery/delivery.schema";
import {EmailSetting} from "@wizardcoder/bl-email/dist/ts/template/email-setting";
import {EmailOrder} from "@wizardcoder/bl-email/dist/ts/template/email-order";
import {EmailUser} from "@wizardcoder/bl-email/dist/ts/template/email-user";
import {isNullOrUndefined} from "util";
import {DibsEasyPayment} from "../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import moment = require("moment");


export class OrderEmailHandler {
	private defaultCurrency = 'NOK';
	private standardDayFormat = 'DD.MM.YYYY';
	private standardTimeFormat = 'DD.MM.YYYY HH.mm.ss';
	private localeSetting = 'nb';

	constructor(private _emailHandler: EmailHandler, private _deliveryStorage?: BlDocumentStorage<Delivery>, private _paymentStorage?: BlDocumentStorage<Payment>) {
		this._deliveryStorage = (_deliveryStorage) ? _deliveryStorage : new BlDocumentStorage('deliveries', deliverySchema);
		this._paymentStorage = (_paymentStorage) ? _paymentStorage : new BlDocumentStorage('payments', paymentSchema);
	}

	public async sendOrderReceipt(customerDetail: UserDetail, order: Order): Promise<EmailLog> {
		let emailSetting: EmailSetting = {
			toEmail: customerDetail.email,
			fromEmail: EMAIL_SETTINGS.types.receipt.fromEmail,
			subject: EMAIL_SETTINGS.types.receipt.subject,
			userId: customerDetail.id
		};

		let emailOrder: EmailOrder = await this.orderToEmailOrder(order);

		let emailUser: EmailUser = {
			id: customerDetail.id,
			dob: customerDetail.dob.toString(),
			name: customerDetail.name,
			email: customerDetail.email,
			address: customerDetail.address,
		};

		return this._emailHandler.sendOrderReceipt(emailSetting, emailOrder, emailUser);
	}

	private async orderToEmailOrder(order: Order): Promise<any> {
		let emailOrder: EmailOrder = {
			id: order.id,
			showDeadline: true,
			showPrice: false,
			showStatus: true,
			itemAmount: order.amount.toString(),
			totalAmount: order.amount.toString(), // should include the totalAmount including the delivery amount
			items: this.orderItemsToEmailItems(order.orderItems),
			showDelivery: false,
			delivery: null,
			showPayment: false,
			payment: null
		};

		let emailOrderDelivery: {showDelivery: boolean, delivery: any};
		let emailOrderPayment: {showPayment: boolean, payment: any};

		try {
			emailOrderDelivery = await this.extractEmailOrderDeliveryFromOrder(order);
			emailOrderPayment = await this.extractEmailOrderPaymentFromOrder(order);
		} catch (e) {
			throw new BlError('could not create email based on order');
		}

		emailOrder.showDelivery = emailOrderDelivery.showDelivery;
		emailOrder.delivery = emailOrderDelivery.delivery;


		if (emailOrder.delivery) {
			emailOrder.totalAmount = order.amount + emailOrderDelivery.delivery['price'];
		}

		emailOrder.showPayment = emailOrderPayment.showPayment;
		emailOrder.payment = emailOrderPayment.payment;

		return Promise.resolve(emailOrder);

	}

	private extractEmailOrderPaymentFromOrder(order: Order): Promise<{payment: any, showPayment: boolean}> {
		if (isNullOrUndefined(order.payments) || order.payments.length <= 0) {
			return Promise.resolve({payment: null, showPayment: false});
		}


		let paymentPromiseArr: Promise<Payment>[] = [];

		for (let paymentId of order.payments) {
			paymentPromiseArr.push(this._paymentStorage.get(paymentId));
		}


		return Promise.all(paymentPromiseArr).then((payments: Payment[]) => {
			let emailPayment = {
				total: 0,
				currency: '',
				taxAmount: 0,
				payments: []
			};

			for (let payment of payments) {
				emailPayment.total += payment.amount;

				emailPayment.payments.push(this.paymentToEmailPayment(payment));
			}

			emailPayment.currency = this.defaultCurrency;

			if (emailPayment.payments[0] && emailPayment.payments[0].info) {
				if (emailPayment.payments[0].info['orderDetails']) {
					emailPayment.currency = emailPayment.payments[0].info['orderDetails'].currency;
				}
			}

			return {payment: emailPayment, showPayment: true};
		}).catch((getPaymentsError) => {
			throw getPaymentsError;
		})

	}

	private extractEmailOrderDeliveryFromOrder(order: Order): Promise<{delivery: any, showDelivery: boolean}> {
		if (isNullOrUndefined(order.delivery) || order.delivery.length <= 0) {
			return Promise.resolve({delivery: null, showDelivery: false})
		}

		return this._deliveryStorage.get(order.delivery).then((delivery: Delivery) => {
			if (delivery.method !== 'bring') { // should only show delivery if user has ordered to mail
				return {delivery: null, showDelivery: false}
			}

			return {
				delivery: this.deliveryToEmailDelivery(delivery),
				showDelivery: true
			}
		}).catch((getDeliveryError: BlError) => {
			throw getDeliveryError;
		});
	}

	private paymentToEmailPayment(payment: Payment): any {
		if (!payment) {
			return null
		}

		let paymentObj = {
			method: '',
			amount: '',
			cardInfo: null,
			taxAmount: (!isNullOrUndefined(payment.taxAmount)) ? payment.taxAmount.toString() : null,
			paymentId: '',
			status: this.translatePaymentConfirmed(),
			creationTime: (!isNullOrUndefined(payment.creationTime)) ? moment(payment.creationTime.toString()).format(this.standardTimeFormat) : null
		};

		if (payment.method === 'dibs') {
			if (payment.info) {
				let paymentInfo: DibsEasyPayment = payment.info as DibsEasyPayment;
				if (paymentInfo.paymentDetails) {
					if (paymentInfo.paymentDetails.paymentMethod) {
						paymentObj.method = paymentInfo.paymentDetails.paymentMethod;
					}

					if (paymentInfo.paymentDetails.cardDetails) {
						if (paymentInfo.paymentDetails.cardDetails.maskedPan) {
							paymentObj.cardInfo = '***' + this.stripTo4LastDigits(paymentInfo.paymentDetails.cardDetails.maskedPan);
						}
					}
				}

				if (paymentInfo.orderDetails) {
					if (paymentInfo.orderDetails.amount) {
						paymentObj.amount = (parseInt(paymentInfo.orderDetails.amount.toString())/100).toString();
					}
				}

				if (paymentInfo.paymentId) {
					paymentObj.paymentId = paymentInfo.paymentId;
				}
			}
		} else {
			if (payment.method) {
				paymentObj.method = payment.method;
			}

			if (payment.amount) {
				paymentObj.amount = payment.amount.toString();
			}

			if (payment.id) {
				paymentObj.paymentId = payment.id;
			}
		}

		return paymentObj;
	}


	private deliveryToEmailDelivery(delivery: Delivery): any {
		let deliveryAddress = null;

		if (delivery.info['shipmentAddress']) {
			deliveryAddress = delivery.info['shipmentAddress'].name;
			deliveryAddress += ', ' + delivery.info['shipmentAddress'].address;
			deliveryAddress += ', ' + delivery.info['shipmentAddress'].postalCode;
			deliveryAddress += ' ' + delivery.info['shipmentAddress'].postalCity;

		}
		return {
			method: delivery.method,
			price: delivery.amount,
			address: deliveryAddress,
			estimatedDeliveryDate: (delivery.info['estimatedDelivery']) ? moment(delivery.info['estimatedDelivery']).format(this.standardDayFormat) : ''
		}
	}


	private orderItemsToEmailItems(orderItems: OrderItem[]): {title: string, status: string, deadline?: string, price?: string}[] {
		let emailItems: {title: string, status: string, deadline?: string, price?: string}[] = [];

		for (const orderItem of orderItems) {
			emailItems.push({
				title: orderItem.title,
				status: this.translateOrderItemType(orderItem.type),
				deadline: (orderItem.type === 'rent' || orderItem.type === 'extend') ? moment(orderItem.info.to).format(this.standardDayFormat) + '' : null,
				price: (orderItem.type !== 'return' && orderItem.amount) ? orderItem.amount.toString() : null
			});
		}

		return emailItems;
	}

	private stripTo4LastDigits(cardNum: string) {
		if (cardNum && cardNum.length > 4) {
			let last4 = cardNum[cardNum.length - 4];
			last4 += cardNum[cardNum.length - 3];
			last4 += cardNum[cardNum.length - 2];
			last4 += cardNum[cardNum.length - 1];
			return last4;
		}
		return cardNum;
	}

	private translatePaymentConfirmed(): string {
		if (this.localeSetting === 'nb') {
			return 'bekreftet';
		}
		return 'confirmed';
	}

	private translateOrderItemType(orderItemType: OrderItemType): string {
		if (this.localeSetting === 'nb') {
			if (orderItemType === 'rent') {
				return 'leie';
			} else if (orderItemType === 'return') {
				return 'returnert';
			} else if (orderItemType === 'extend') {
				return 'forlenget'
			} else if (orderItemType === 'cancel') {
				return 'kansellert'
			} else if (orderItemType === 'buy') {
				return 'kjøp'
			}
		}


		return orderItemType;
	}
}