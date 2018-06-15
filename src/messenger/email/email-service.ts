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
		let emailSetting: EmailSetting = {
			toEmail: customerDetail.email,
			fromEmail: EMAIL_SETTINGS.types.emailConfirmation.fromEmail,
			subject: EMAIL_SETTINGS.types.emailConfirmation.subject,
			userId: customerDetail.id
		};

		this._emailHandler.sendEmailVerification(emailSetting, EMAIL_SETTINGS.types.emailConfirmation.uri + confirmationCode).then((emailLog) => {

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

		this._emailHandler.sendPasswordReset(emailSetting, process.env.CLIENT_URI + EMAIL_SETTINGS.types.passwordReset.path + passwordResetCode).then((emailLog) => {

		}).catch((emailError) => {

		})
	}
}