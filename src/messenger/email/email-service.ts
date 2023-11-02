/* eslint-disable @typescript-eslint/no-empty-function */
import { EmailHandler } from "@boklisten/bl-email";
import { EmailOrder } from "@boklisten/bl-email/dist/ts/template/email-order";
import { EmailSetting } from "@boklisten/bl-email/dist/ts/template/email-setting";
import { EmailUser } from "@boklisten/bl-email/dist/ts/template/email-user";
import {
  Delivery,
  Order,
  OrderItem,
  UserDetail,
  CustomerItem,
  Item,
  Message,
} from "@boklisten/bl-model";
import {
  Recipient,
  MessageOptions,
  PostOffice,
  postOffice,
} from "@boklisten/bl-post-office";

import { EMAIL_SETTINGS } from "./email-settings";
import { OrderEmailHandler } from "./order-email/order-email-handler";
import { dateService } from "../../blc/date.service";
import { BlCollectionName } from "../../collections/bl-collection";
import { itemSchema } from "../../collections/item/item.schema";
import { logger } from "../../logger/logger";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import {
  MessengerService,
  CustomerDetailWithCustomerItem,
} from "../messenger-service";

export class EmailService implements MessengerService {
  private _emailHandler: EmailHandler;
  private _orderEmailHandler: OrderEmailHandler;
  private _itemStorage: BlDocumentStorage<Item>;
  private _postOffice: PostOffice;

  constructor(
    emailHandler?: EmailHandler,
    itemStorage?: BlDocumentStorage<Item>,
    inputPostOffice?: PostOffice,
  ) {
    this._emailHandler = emailHandler
      ? emailHandler
      : new EmailHandler({
          sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY,
          },
          locale: "nb",
        });

    this._itemStorage = itemStorage
      ? itemStorage
      : new BlDocumentStorage<Item>(BlCollectionName.Items, itemSchema);
    this._orderEmailHandler = new OrderEmailHandler(this._emailHandler);
    this._postOffice = inputPostOffice ? inputPostOffice : postOffice;
    this._postOffice.overrideLogger(logger);
    this._postOffice.setConfig({
      reminder: { mediums: { email: true, sms: true } },
      generic: { mediums: { email: true } },
      receipt: { mediums: { email: false, sms: false } },
      match: { mediums: { sms: true } },
      booking: { mediums: { email: true } },
    });
  }

  public send(message: Message, customerDetail: UserDetail): Promise<boolean> {
    if (message.messageType === "generic") {
      return this.sendGeneric(message, customerDetail);
    } else if (message.messageType === "match") {
      return this.sendMatch(message, customerDetail);
    }

    throw `message type "${message.messageType}" not supported`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendMany(messages: Message[], customerDetails: UserDetail[]) {}

  public async sendGeneric(
    message: Message,
    customerDetail: UserDetail,
  ): Promise<boolean> {
    const recipient = await this.customerDetailToRecipient(
      message,
      customerDetail,
      [],
    );

    const messageOptions: MessageOptions = {
      type: "generic",
      subtype: "none",
      subject: message.subject,
      sequence_number: message.sequenceNumber,
      htmlContent: message.htmlContent,
      textBlocks: message.textBlocks,
      mediums: this.getMessageOptionMediums(message),
    };

    try {
      await this._postOffice.send([recipient], messageOptions);
      return true;
    } catch (e) {
      logger.error(`could not send generic mail: ${e}`);
    }
    return undefined;
  }

  public async sendBookingEmail(
    message: Message,
    customerDetail: UserDetail,
    bookingDetails: {
      date: string;
      hour: string;
      branch: string;
      address: string;
    },
  ): Promise<boolean> {
    const recipient = await this.customerDetailToRecipient(
      message,
      customerDetail,
      [],
    );

    recipient["booking"] = bookingDetails;

    const messageOptions: MessageOptions = {
      type: "booking",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subtype: message.messageSubtype as any,
      mediums: { email: true },
    };

    try {
      await this._postOffice.send([recipient], messageOptions);
      return true;
    } catch (e) {
      logger.error(`could not send booking confirmation: ${e}`);
    }
    return undefined;
  }

  public async sendMatch(
    message: Message,
    customerDetail: UserDetail,
  ): Promise<boolean> {
    const recipient = await this.customerDetailToRecipient(
      message,
      customerDetail,
      [],
    );

    const messageOptions: MessageOptions = {
      type: "match",
      subtype: "none",
      subject: message.subject,
      sequence_number: message.sequenceNumber,
      htmlContent: message.htmlContent,
      textBlocks: message.textBlocks,
      mediums: this.getMessageOptionMediums(message),
    };

    try {
      await this._postOffice.send([recipient], messageOptions);
      return true;
    } catch (e) {
      logger.error(`could not send match message: ${e}`);
    }
    return undefined;
  }

  /**
   * Sends out a reminder to the email specified in customerDetail
   * The email will include the customerItems with the deadline
   * @param message message the email service should update on later actions
   * @param customerDetail the customer to send email to
   * @param customerItems a list of customerItems to include in the email
   */
  public async remind(
    message: Message,
    customerDetail: UserDetail,
    customerItems: CustomerItem[],
  ): Promise<boolean> {
    const recipient = await this.customerDetailToRecipient(
      message,
      customerDetail,
      customerItems,
    );

    const messageOptions: MessageOptions = {
      type: "reminder",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subtype: message.messageSubtype as any,
      sequence_number: message.sequenceNumber,
      textBlocks: message.textBlocks,
      mediums: this.getMessageOptionMediums(message),
    };

    try {
      await this._postOffice.send([recipient], messageOptions);

      if (
        customerDetail.dob &&
        customerDetail.guardian &&
        !dateService.isOver18(customerDetail.dob)
      ) {
        await this.sendToGuardian(customerDetail, recipient, messageOptions);
      }
      return true;
    } catch (e) {
      logger.error(`could not send reminder: ${e}`);
      return true;
    }
  }

  private async sendToGuardian(
    customerDetail: UserDetail,
    recipient: Recipient,
    messageOptions: MessageOptions,
  ): Promise<boolean> {
    if (!customerDetail.guardian) {
      return false;
    }

    if (!customerDetail.guardian.email || !customerDetail.guardian.phone) {
      return false;
    }

    recipient.email = customerDetail.guardian.email;
    recipient.phone = "+47" + customerDetail.guardian.phone;

    return this._postOffice.send([recipient], messageOptions);
  }

  private getMessageOptionMediums(message: Message): {
    email: boolean;
    sms: boolean;
    voice: boolean;
  } {
    switch (message.messageMethod) {
      case "all":
        return { email: true, sms: true, voice: false };
      case "email":
        return { email: true, sms: false, voice: false };
      case "sms":
        return { email: false, sms: true, voice: false };
      default:
        return {
          email: false,
          sms: false,
          voice: false,
        };
    }
  }

  public remindMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    customerDetailsWithCustomerItems: CustomerDetailWithCustomerItem[],
  ) {}

  public orderPlaced(customerDetail: UserDetail, order: Order) {
    this._orderEmailHandler
      .sendOrderReceipt(customerDetail, order)
      .then(() => {})
      .catch(() => {});
  }

  private async customerDetailToRecipient(
    message: Message,
    customerDetail: UserDetail,
    customerItems: CustomerItem[],
  ): Promise<Recipient> {
    return {
      message_id: message.id,
      user_id: customerDetail.id,
      email: customerDetail.email,
      name: customerDetail.name,
      phone: "+47" + customerDetail.phone,
      settings: {
        text: {
          deadline: message.info
            ? this.formatDeadline(message.info["deadline"])
            : "",
        },
      },
      itemList: await this.customerItemsToItemList(message, customerItems),
    };
  }

  private async customerItemsToItemList(
    message: Message,
    customerItems: CustomerItem[],
  ) {
    if (message.messageSubtype === "partly-payment") {
      return {
        summary: {
          total:
            this.getCustomerItemLeftToPayTotal(customerItems).toString() +
            " NOK",
          totalTax: "0 NOK",
          taxPercentage: "0",
        },
        items: await this.customerItemsToEmailItems(message, customerItems),
      };
    } else {
      return {
        summary: {
          total: null,
          totalTax: null,
          taxPercentage: null,
        },
        items: await this.customerItemsToEmailItems(message, customerItems),
      };
    }
  }

  private async customerItemsToEmailItems(
    message: Message,
    customerItems: CustomerItem[],
  ) {
    const items = [];

    for (const customerItem of customerItems) {
      const item = await this._itemStorage.get(customerItem.item as string);
      items.push(this.customerItemToEmailItem(message, customerItem, item));
    }

    return items;
  }

  private customerItemToEmailItem(
    message: Message,
    customerItem: CustomerItem,
    item: Item,
  ) {
    if (message.messageSubtype === "partly-payment") {
      return {
        id: this.getItemIsbn(item),
        title: item.title,
        deadline: this.formatDeadline(message.info["deadline"]),
        leftToPay: customerItem.amountLeftToPay + " NOK",
      };
    } else {
      return {
        id: this.getItemIsbn(item),
        title: item.title,
        deadline: this.formatDeadline(message.info["deadline"]),
      };
    }
  }

  private formatDeadline(deadline) {
    return deadline !== null && deadline !== undefined
      ? dateService.toPrintFormat(deadline, "Europe/Oslo")
      : "";
  }

  private getItemIsbn(item: Item): string {
    return item.info && item.info["isbn"] ? item.info["isbn"] : item.id;
  }

  private getCustomerItemLeftToPayTotal(customerItems: CustomerItem[]): number {
    return customerItems.reduce(
      (total, next) => total + next.amountLeftToPay,
      0,
    );
  }

  public deliveryInformation(
    customerDetail: UserDetail,
    order: Order,
    delivery: Delivery,
  ) {
    const emailSetting: EmailSetting = {
      toEmail: customerDetail.email,
      fromEmail: EMAIL_SETTINGS.types.deliveryInformation.fromEmail,
      subject: EMAIL_SETTINGS.types.deliveryInformation.subject,
      userId: customerDetail.id,
      textBlocks: [
        {
          text: "Dine bøker er nå på vei! De vil bli levert til deg ved hjelp av Bring.",
        },
        {
          text: "Vi anser nå disse bøkene som utlevert. Du er ansvarlig for bøkene fra du henter dem på postkontoret til innlevering er gjennomført. Om noe skulle skje med leveringen er det bare å ta kontakt. Fraktkostnader refunderes ikke for pakker som ikke blir hentet innen fristen.",
        },
      ],
    };

    const emailUser: EmailUser = {
      id: customerDetail.id,
      name: customerDetail.name,
      dob:
        customerDetail.dob !== undefined && customerDetail.dob !== null
          ? dateService.format(customerDetail.dob, "Europe/Oslo", "DD.MM.YYYY")
          : "",
      email: customerDetail.email,
      address: customerDetail.address,
    };

    let deliveryAddress = "";

    if (delivery.info["shipmentAddress"]) {
      deliveryAddress = delivery.info["shipmentAddress"].name;
      deliveryAddress += ", " + delivery.info["shipmentAddress"].address;
      deliveryAddress += ", " + delivery.info["shipmentAddress"].postalCode;
      deliveryAddress += " " + delivery.info["shipmentAddress"].postalCity;
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
        method: "bring",
        trackingNumber: delivery.info["trackingNumber"],
        estimatedDeliveryDate: null,
        address: deliveryAddress,
        amount: null,
        currency: null,
      },
    };

    this._emailHandler
      .sendDelivery(emailSetting, emailOrder, emailUser)
      .then(() => {})
      .catch((err) => {
        logger.log("warn", "could not send delivery info by mail: " + err);
      });
  }

  private orderItemsToDeliveryInformationItems(orderItems: OrderItem[]) {
    const emailInformaitionItems: { title: string; status: string }[] = [];
    for (const orderItem of orderItems) {
      emailInformaitionItems.push({
        title: orderItem.title,
        status: "utlevering via Bring",
      });
    }
    return emailInformaitionItems;
  }

  public emailConfirmation(
    customerDetail: UserDetail,
    confirmationCode: string,
  ) {
    const emailSetting: EmailSetting = {
      toEmail: customerDetail.email,
      fromEmail: EMAIL_SETTINGS.types.emailConfirmation.fromEmail,
      subject: EMAIL_SETTINGS.types.emailConfirmation.subject,
      userId: customerDetail.id,
    };

    let emailVerificationUri = process.env.CLIENT_URI
      ? process.env.CLIENT_URI
      : "localhost:4200/";
    emailVerificationUri +=
      EMAIL_SETTINGS.types.emailConfirmation.path + confirmationCode;

    this._emailHandler
      .sendEmailVerification(emailSetting, emailVerificationUri)
      .then(() => {})
      .catch(() => {});
  }

  public async passwordReset(
    userId: string,
    userEmail: string,
    passwordResetCode: string,
  ): Promise<void> {
    const emailSetting: EmailSetting = {
      toEmail: userEmail,
      fromEmail: EMAIL_SETTINGS.types.passwordReset.fromEmail,
      subject: EMAIL_SETTINGS.types.passwordReset.subject,
      userId: userId,
    };

    let passwordResetUri = process.env.CLIENT_URI
      ? process.env.CLIENT_URI
      : "localhost:4200/";
    passwordResetUri +=
      EMAIL_SETTINGS.types.passwordReset.path + passwordResetCode;

    await this._emailHandler.sendPasswordReset(emailSetting, passwordResetUri);
  }
}
