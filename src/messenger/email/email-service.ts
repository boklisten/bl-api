import {EmailHandler, EmailLog, EmailTemplateInput} from "@wizardcoder/bl-email";
import {BlError, Delivery, Order, OrderItem, Payment, UserDetail} from "@wizardcoder/bl-model";
import {OrderItemType} from "@wizardcoder/bl-model/dist/order/order-item/order-item-type";
import * as fs from "fs";
import {EmailAttachment} from "@wizardcoder/bl-email/dist/ts/template/email-attachment";
import {type} from "os";
import {OrderEmailHandler} from "./order-email/order-email-handler";
import {MessengerService} from "../messenger-service";
import {Message} from "../message";


export class EmailService implements MessengerService {
	private _emailHandler: EmailHandler;
	private _orderEmailHandler: OrderEmailHandler;

	constructor(emailHandler?: EmailHandler) {
		this._emailHandler = (emailHandler) ? emailHandler : new EmailHandler({
			sendgrid: {
				apiKey: process.env.SENDGRID_API_KEY
			}
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
			console.log('we sent the email', emailLog);
		}).catch((emailError) => {
			console.log('there was a error with sending email', emailError);
		});
	}

	public emailConfirmation(customerDetail: UserDetail, confirmationCode: string) {

	}

	public passwordReset(customerDetail: UserDetail, passwordResetCode: string) {

	}
}