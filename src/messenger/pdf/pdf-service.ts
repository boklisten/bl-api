import {EmailAttachment, EmailHandler, PdfHandler} from "@wizardcoder/bl-email";
import {Order, UserDetail} from "@wizardcoder/bl-model";
import {EmailSetting} from "@wizardcoder/bl-email/dist/ts/template/email-setting";
import {EmailUser} from "@wizardcoder/bl-email/dist/ts/template/email-user";
import {isNullOrUndefined} from "util";
import moment = require("moment");
import {EmailOrder} from "@wizardcoder/bl-email/dist/ts/template/email-order";
import {OrderEmailHandler} from "../email/order-email/order-email-handler";


export class PdfService {
	private _pdfHandler: PdfHandler;
	private _standardDayFormat;
	private _orderEmailHandler: OrderEmailHandler;

	constructor() {
		const emailHandler = new EmailHandler(
			{
				sendgrid: {
					apiKey: 'somId'
				}
			}
		);
		this._pdfHandler = new PdfHandler(emailHandler);
		this._standardDayFormat = 'DD.MM.YYYY';
		this._orderEmailHandler = new OrderEmailHandler(emailHandler);
	}

	async getOrderReceiptPdf(customerDetail: UserDetail, order: Order): Promise<EmailAttachment> {
		let emailSetting = {} as EmailSetting;

		let emailUser: EmailUser = {
			id: customerDetail.id,
			dob: (!isNullOrUndefined(customerDetail.dob)) ? moment(customerDetail.dob).format(this._standardDayFormat) : '',
			name: customerDetail.name,
			email: customerDetail.email,
			address: customerDetail.address
		};

		let emailOrder: EmailOrder = await this._orderEmailHandler.orderToEmailOrder(order);

		return await this._pdfHandler.getOrderReceipt(emailSetting, emailOrder, emailUser);
	}

	async getOrderAgreementPdf(customerDetail: UserDetail, order: Order): Promise<EmailAttachment> {
		let emailSetting = {} as EmailSetting;

		let emailUser: EmailUser = {
			id: customerDetail.id,
			dob: (!isNullOrUndefined(customerDetail.dob)) ? moment(customerDetail.dob).format(this._standardDayFormat) : '',
			name: customerDetail.name,
			email: customerDetail.email,
			address: customerDetail.address
		};

		let emailOrder: EmailOrder = await this._orderEmailHandler.orderToEmailOrder(order);

		return await this._pdfHandler.getRentAgreement(emailSetting, emailOrder, emailUser);
	}


}