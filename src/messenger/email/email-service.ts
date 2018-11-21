import {EmailHandler, EmailLog, EmailTemplateInput} from "@wizardcoder/bl-email";
import {BlError, Delivery, Order, OrderItem, Payment, UserDetail, CustomerItem, Item, Message} from "@wizardcoder/bl-model";
import { BlDocumentStorage } from '../../storage/blDocumentStorage';
import {OrderItemType} from "@wizardcoder/bl-model/dist/order/order-item/order-item-type";
import * as fs from "fs";
import {EmailAttachment} from "@wizardcoder/bl-email/dist/ts/template/email-attachment";
import {type} from "os";
import {OrderEmailHandler} from "./order-email/order-email-handler";
import {MessengerService, CustomerDetailWithCustomerItem} from "../messenger-service";
import {EmailSetting} from "@wizardcoder/bl-email/dist/ts/template/email-setting";
import {EMAIL_SETTINGS} from "./email-settings";
import {EmailOrder} from "@wizardcoder/bl-email/dist/ts/template/email-order";
import {EmailUser} from "@wizardcoder/bl-email/dist/ts/template/email-user";
import moment = require("moment");
import {isNullOrUndefined} from "util";
import {logger} from "../../logger/logger";
import { itemSchema } from '../../collections/item/item.schema';

export class EmailService implements MessengerService {
	private _emailHandler: EmailHandler;
	private _orderEmailHandler: OrderEmailHandler;
  private _dateFormat: string;
  private _itemStorage: BlDocumentStorage<Item>;

  constructor(emailHandler?: EmailHandler, itemStorage?: BlDocumentStorage<Item>) {
		this._emailHandler = (emailHandler) ? emailHandler : new EmailHandler({
			sendgrid: {
				apiKey: process.env.SENDGRID_API_KEY
			},
			locale: 'nb'
    });

    this._itemStorage = (itemStorage) ? itemStorage : new BlDocumentStorage<Item>('items', itemSchema);
    this._dateFormat = 'DD.MM.YYYY';
		this._orderEmailHandler = new OrderEmailHandler(this._emailHandler);
	}

	public send(messages: Message[], customerDetail: UserDetail) {
	}

	public sendMany(messages: Message[], customerDetails: UserDetail[]) {
	}
  
  /**
   * Sends out a reminder to the email specified in customerDetail
   * The email will include the customerItems with the deadline
   * @param message message the email service should update on later actions 
   * @param customerDetail the customer to send email to
   * @param customerItems a list of customerItems to include in the email
   */
  public async remind(message: Message, customerDetail: UserDetail, customerItems: CustomerItem[]): Promise<boolean> {
    const emailUser = this.customerDetailToEmailUser(customerDetail);

    const emailOrder: EmailOrder = {
      id: '',
      itemAmount: '0',
      totalAmount: '0',
      items: await this.customerItemsToEmailOrderItems(customerItems),
      payment: null
    };

    const emailSetting: EmailSetting = {
      userId: emailUser.id,
      toEmail: emailUser.email,
      fromEmail: 'ikkesvar@boklisten.no',
      subject: 'På tide å levere bøkene',
      textBlocks: (message.textBlocks && message.textBlocks.length > 0) ? message.textBlocks : []
    };

    try {
      await this._emailHandler.sendReminder(emailSetting, emailOrder, emailUser);
      return true;
    } catch (e) {
      throw e;
    }
	}

	public remindMany(customerDetailsWithCustomerItems: CustomerDetailWithCustomerItem[]) {

	}

	public orderPlaced(customerDetail: UserDetail, order: Order) {
		this._orderEmailHandler.sendOrderReceipt(customerDetail, order).then((emailLog) => {

		}).catch((emailError) => {

		});
  }

  private customerDetailToEmailUser(customerDetail: UserDetail): EmailUser {
    return {
			id: customerDetail.id,
			name: customerDetail.name,
			dob: (!isNullOrUndefined(customerDetail.dob)) ? moment(customerDetail.dob).format('DD.MM.YYYY') : '',
			email: customerDetail.email,
			address: customerDetail.address
		}
  }

  private async customerItemsToEmailOrderItems(customerItems: CustomerItem[]) {
    const emailOrderItems = [];


    for (let customerItem of customerItems) {
      const item = await this._itemStorage.get(customerItem.item);

      emailOrderItems.push({
        title: item.title,
        deadline: moment(customerItem.deadline).format(this._dateFormat)
      });
    }
    
    return emailOrderItems;
  }

	public deliveryInformation(customerDetail: UserDetail, order: Order, delivery: Delivery) {
		let emailSetting: EmailSetting = {
			toEmail: customerDetail.email,
			fromEmail: EMAIL_SETTINGS.types.deliveryInformation.fromEmail,
			subject: EMAIL_SETTINGS.types.deliveryInformation.subject,
			userId: customerDetail.id,
			textBlocks: [
				{
					text: 'Dine bøker er nå på vei! De vil bli levert til deg ved hjelp av Bring.'
				},
				{
					text: 'Vi anser nå disse bøkene som utlevert. Du er ansvarlig for bøkene fra du henter dem på postkontoret til innlevering er gjennomført. Om noe skulle skje med leveringen er det bare å ta kontakt. Fraktkostnader refunderes ikke for pakker som ikke blir hentet innen fristen.'
				}
			]
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
