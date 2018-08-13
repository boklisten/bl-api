import {EmailHandler, EmailLog, EmailTemplateInput} from "@wizardcoder/bl-email";
import {BlError, Delivery, Order, OrderItem, Payment, UserDetail} from "@wizardcoder/bl-model";
import {OrderItemType} from "@wizardcoder/bl-model/dist/order/order-item/order-item-type";
import * as fs from "fs";
import {EmailAttachment} from "@wizardcoder/bl-email/dist/ts/template/email-attachment";
import {type} from "os";
import {OrderEmailHandler} from "./order-email/order-email-handler";
import {MessengerService} from "../messenger-service";
import {Message} from "../message";
import {EmailSetting} from "@wizardcoder/bl-email/dist/ts/template/email-setting";
import {EMAIL_SETTINGS} from "./email-settings";
import {EmailOrder} from "@wizardcoder/bl-email/dist/ts/template/email-order";
import {EmailUser} from "@wizardcoder/bl-email/dist/ts/template/email-user";
import moment = require("moment");
import {isNullOrUndefined} from "util";
import {logger} from "../../logger/logger";


export class EmailService implements MessengerService {
	private _emailHandler: EmailHandler;
	private _orderEmailHandler: OrderEmailHandler;

	constructor(emailHandler?: EmailHandler) {
		this._emailHandler = (emailHandler) ? emailHandler : new EmailHandler({
			sendgrid: {
				apiKey: process.env.SENDGRID_API_KEY
			},
			locale: 'nb'
		});

		this._orderEmailHandler = new OrderEmailHandler(this._emailHandler);
	}

	public send(messages: Message[], customerDetail: UserDetail) {

	}

	public sendMany(messages: Message[], customerDetails: UserDetail[]) {

	}

	public remind(customerDetail: UserDetail) {

	}

	public remindMany(customerDetails: UserDetail[]) {

	}

	public orderPlaced(customerDetail: UserDetail, order: Order) {
		this._orderEmailHandler.sendOrderReceipt(customerDetail, order).then((emailLog) => {

		}).catch((emailError) => {

		});
	}

	public deliveryInformation(customerDetail: UserDetail, order: Order, delivery: Delivery) {
		let emailSetting: EmailSetting = {
			toEmail: customerDetail.email,
			fromEmail: EMAIL_SETTINGS.types.deliveryInformation.fromEmail,
			subject: EMAIL_SETTINGS.types.deliveryInformation.subject,
			userId: customerDetail.id
		};

		let emailUser: EmailUser = {
			id: customerDetail.id,
			name: customerDetail.name,
			dob: (!isNullOrUndefined(customerDetail.dob)) ? moment(customerDetail.dob).format('DD.MM.YYYY') : '',
			email: customerDetail.email,
			address: customerDetail.address
		};

		let deliveryAddress = '';

		if (delivery.info['shipmentAddress']) {
			deliveryAddress = delivery.info['shipmentAddress'].name;
			deliveryAddress += ', ' + delivery.info['shipmentAddress'].address;
			deliveryAddress += ', ' + delivery.info['shipmentAddress'].postalCode;
			deliveryAddress += ' ' + delivery.info['shipmentAddress'].postalCity;

		}

		const emailOrder: EmailOrder = {
			id: order.id,
			showDeadline: false,
			showPrice: false,
			showStatus: true,
			currency: null,
			itemAmount: null,
			payment: null,
			showPayment: false,
			totalAmount: null,
			items: this.orderItemsToDeliveryInformationItems(order.orderItems),
			showDelivery: true,
			delivery: {
				method: 'bring',
				trackingNumber: delivery.info['trackingNumber'],
				estimatedDeliveryDate: null,
				address: deliveryAddress,
				amount: null,
				currency: null
			}
		};

		this._emailHandler.sendDelivery(emailSetting, emailOrder, emailUser).then(() => {

		}).catch((err) => {
			logger.log('warn', 'could not send delivery info by mail: ' + err);
		})


	}

	private orderItemsToDeliveryInformationItems(orderItems: OrderItem[]) {
		const emailInformaitionItems: {title: string, status: string}[] = [];
		for (let orderItem of orderItems) {
			emailInformaitionItems.push({
				title: orderItem.title,
				status: 'utlevering via Bring'
			});
		}
		return emailInformaitionItems;
	}

	public emailConfirmation(customerDetail: UserDetail, confirmationCode: string) {
		let emailSetting: EmailSetting = {
			toEmail: customerDetail.email,
			fromEmail: EMAIL_SETTINGS.types.emailConfirmation.fromEmail,
			subject: EMAIL_SETTINGS.types.emailConfirmation.subject,
			userId: customerDetail.id
		};


		let emailVerificationUri = (process.env.CLIENT_URI) ? process.env.CLIENT_URI : 'localhost:4200/';
		emailVerificationUri += EMAIL_SETTINGS.types.emailConfirmation.path + confirmationCode;

		this._emailHandler.sendEmailVerification(emailSetting, emailVerificationUri).then((emailLog) => {

		}).catch((emailError) => {

		});
	}

	public passwordReset(customerDetail: UserDetail, passwordResetCode: string) {
		let emailSetting: EmailSetting = {
			toEmail: customerDetail.email,
			fromEmail: EMAIL_SETTINGS.types.passwordReset.fromEmail,
			subject: EMAIL_SETTINGS.types.passwordReset.subject,
			userId: customerDetail.id
		};

		let passwordResetUri = (process.env.CLIENT_URI) ? process.env.CLIENT_URI : 'localhost:4200/';
		passwordResetUri += EMAIL_SETTINGS.types.passwordReset.path + passwordResetCode;

		this._emailHandler.sendPasswordReset(emailSetting, passwordResetUri).then((emailLog) => {

		}).catch((emailError) => {

		})
	}
}