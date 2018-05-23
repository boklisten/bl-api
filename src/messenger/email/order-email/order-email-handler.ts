import {EmailHandler, EmailLog, EmailTemplateInput} from "@wizardcoder/bl-email";
import {OrderItemType} from "@wizardcoder/bl-model/dist/order/order-item/order-item-type";
import {Delivery, Order, OrderItem, Payment, UserDetail, BlError} from "@wizardcoder/bl-model";
import {EMAIL_SETTINGS} from "../email-settings";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../../../collections/payment/payment.schema";
import {deliverySchema} from "../../../collections/delivery/delivery.schema";
import {EmailSetting} from "@wizardcoder/bl-email/dist/ts/template/email-setting";
import {EmailOrder} from "@wizardcoder/bl-email/dist/ts/template/email-order";
import {EmailUser} from "@wizardcoder/bl-email/dist/ts/template/email-user";


export class OrderEmailHandler {

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

	private orderToEmailOrder(order: Order): Promise<any> {
		const promiseArr: Promise<Delivery | Payment>[] = [];

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

		if (order.delivery) {
			promiseArr.push(this._deliveryStorage.get(order.delivery));
		}

		for (let payment of order.payments) {
			promiseArr.push(this._paymentStorage.get(payment));
		}


		Promise.all(promiseArr).then((values) => {
			if (order.delivery) {
				emailOrder.showDelivery = true;
				emailOrder.delivery = this.deliveryToEmailDelivery(values[0] as Delivery);
				emailOrder.totalAmount = (order.amount + values[0].amount).toString();
			}

			if (values.length > 1) {
				emailOrder.payment = {
					total: '',
					currency: 'NOK',
					payments: [],
				};

				let total = 0;

				for (let i = 1; i < values.length; i++) {
					emailOrder.payment.payments.push(this.paymentToEmailPayment(values[i] as Payment));
					total += values[i].amount;
				}

				emailOrder.payment.total = total.toString();
				emailOrder.showPrice = true;
			}
		});

		return Promise.resolve(emailOrder);

	}

	private paymentToEmailPayment(payment: Payment): any {
		if (!payment) {
			return null
		}

		return {
			type: payment.method,
			amount: payment.amount,
			cardInfo: '****',
			currency: 'NOK',
			taxAmount: payment.taxAmount,
			paymentId: (payment.info['paymentId']) ? payment.info['paymentId'] : '',
			status: (payment.info['status']) ? payment.info['status'] : '',
			creationTime: payment.creationTime.toString()
		}
	}

	private deliveryToEmailDelivery(delivery: Delivery): any {

		return {
			method: delivery.method,
			price: delivery.amount,
			address: (delivery.info['address']) ? delivery.info['address'] : null,
			estimatedDeliveryDate: (delivery.info['estimatedDelivery']) ? delivery.info['estimatedDelivery'] : ''
		}
	}


	private orderItemsToEmailItems(orderItems: OrderItem[]): {title: string, status: string, deadline?: string, price?: string}[] {
		let emailItems: {title: string, status: string, deadline?: string, price?: string}[] = [];

		for (const orderItem of orderItems) {
			emailItems.push({
				title: orderItem.title,
				status: this.translateOrderItemType(orderItem.type),
				deadline: (orderItem.type === 'rent' || orderItem.type === 'extend') ? orderItem.info.to + '' : null,
				price: (orderItem.type !== 'return') ? orderItem.amount.toString() : null
			});
		}

		return emailItems;
	}

	private translateOrderItemType(orderItemType: OrderItemType): string {
		return orderItemType;
	}
}