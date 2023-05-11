/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmailHandler, EmailLog } from "@boklisten/bl-email";
import { OrderItemType } from "@boklisten/bl-model/dist/order/order-item/order-item-type";
import {
  Delivery,
  Order,
  OrderItem,
  Payment,
  UserDetail,
  BlError,
  Branch,
} from "@boklisten/bl-model";
import { EMAIL_SETTINGS } from "../email-settings";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { paymentSchema } from "../../../collections/payment/payment.schema";
import { deliverySchema } from "../../../collections/delivery/delivery.schema";
import { EmailSetting } from "@boklisten/bl-email/dist/ts/template/email-setting";
import { EmailOrder } from "@boklisten/bl-email/dist/ts/template/email-order";
import { EmailUser } from "@boklisten/bl-email/dist/ts/template/email-user";
import { DibsEasyPayment } from "../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import moment = require("moment-timezone");
import { branchSchema } from "../../../collections/branch/branch.schema";
import { dateService } from "../../../blc/date.service";
import { BlCollectionName } from "../../../collections/bl-collection";

export class OrderEmailHandler {
  private defaultCurrency = "NOK";
  private standardDayFormat = "DD.MM.YY";
  private standardTimeFormat = "DD.MM.YYYY HH.mm.ss";
  private localeSetting = "nb";
  private noPaymentNoticeText =
    "Dette er kun en reservasjon, du har ikke betalt enda. Du betaler først når du kommer til oss på stand.";
  private agreementTextBlock =
    "Vedlagt i denne mailen ligger en kontrakt som du trenger å skrive under på for å få lånt bøkene. Kontrakten må du ha med deg når du kommer til oss på stand.";
  private utcOffset = 120;

  constructor(
    private _emailHandler: EmailHandler,
    private _deliveryStorage?: BlDocumentStorage<Delivery>,
    private _paymentStorage?: BlDocumentStorage<Payment>,
    private _branchStorage?: BlDocumentStorage<Branch>
  ) {
    this._deliveryStorage = _deliveryStorage
      ? _deliveryStorage
      : new BlDocumentStorage(BlCollectionName.Deliveries, deliverySchema);
    this._paymentStorage = _paymentStorage
      ? _paymentStorage
      : new BlDocumentStorage(BlCollectionName.Payments, paymentSchema);
    this._branchStorage = _branchStorage
      ? _branchStorage
      : new BlDocumentStorage(BlCollectionName.Branches, branchSchema);
  }

  public async sendOrderReceipt(
    customerDetail: UserDetail,
    order: Order
  ): Promise<EmailLog> {
    const emailSetting: EmailSetting = {
      toEmail: customerDetail.email,
      fromEmail: EMAIL_SETTINGS.types.receipt.fromEmail,
      subject: EMAIL_SETTINGS.types.receipt.subject + ` #${order.id}`,
      userId: customerDetail.id,
    };

    const branchId = order.branch as string;

    const withAgreement: boolean = await this.shouldSendAgreement(
      order,
      customerDetail,
      branchId
    );

    const emailOrder: EmailOrder = await this.orderToEmailOrder(order);
    emailOrder.loan = withAgreement;

    const emailUser: EmailUser = {
      id: customerDetail.id,
      dob: customerDetail.dob
        ? dateService.toPrintFormat(customerDetail.dob, "Europe/Oslo")
        : "",
      name: customerDetail.name,
      email: customerDetail.email,
      address: customerDetail.address,
    };

    if (withAgreement) {
      this.sendToGuardianIfUserIsUnder18(customerDetail, emailOrder, emailUser);

      emailSetting.textBlocks = [{ text: this.agreementTextBlock }];
    }

    if (this.paymentNeeded(order)) {
      this.addNoPaymentProvidedNotice(emailSetting);
    }

    return this._emailHandler.sendOrderReceipt(
      emailSetting,
      emailOrder,
      emailUser,
      withAgreement
    );
  }

  private paymentNeeded(order: Order): boolean {
    return (
      order.amount > 0 &&
      (!Array.isArray(order.payments) || !order.payments.length)
    );
  }

  private addNoPaymentProvidedNotice(emailSetting: EmailSetting) {
    emailSetting.textBlocks ??= [];

    emailSetting.textBlocks.push({
      text: this.noPaymentNoticeText,
      warning: true,
    });
  }

  private sendToGuardianIfUserIsUnder18(
    customerDetail: UserDetail,
    emailOrder: EmailOrder,
    emailUser: EmailUser
  ) {
    if (
      moment(customerDetail.dob).isValid() &&
      moment(customerDetail.dob).isAfter(
        moment(new Date()).subtract(18, "years")
      ) &&
      customerDetail?.guardian?.email
    ) {
      const emailSetting: EmailSetting = {
        toEmail: customerDetail.guardian.email,
        fromEmail: EMAIL_SETTINGS.types.receipt.fromEmail,
        subject: EMAIL_SETTINGS.types.receipt.subject + ` #${emailOrder.id}`,
        userId: customerDetail.id,
        userFullName: customerDetail.guardian.name,
      };

      emailSetting.textBlocks = [
        {
          text: `Du får denne e-posten fordi du er oppgitt som foresatt til ${customerDetail.name}. Vær vennlig å skriv under på kontrakten som ligger vedlagt og la eleven levere denne når bøkene skal leveres ut. Eleven vil ikke kunne hente ut bøker uten underskrift fra foresatt.`,
        },
      ];

      this._emailHandler.sendOrderReceipt(
        emailSetting,
        emailOrder,
        emailUser,
        true
      );
    }
  }

  public async orderToEmailOrder(order: Order): Promise<any> {
    const emailOrder: EmailOrder = {
      id: order.id,
      showDeadline: this.shouldShowDeadline(order),
      showPrice: order.amount !== 0,
      showStatus: true,
      currency: this.defaultCurrency,
      itemAmount: order.amount.toString(),
      totalAmount: order.amount.toString(), // should include the totalAmount including the delivery amount
      items: this.orderItemsToEmailItems(order.orderItems),
      showDelivery: false,
      delivery: null,
      showPayment: false,
      payment: null,
    };

    let emailOrderDelivery: { showDelivery: boolean; delivery: any };
    let emailOrderPayment: { showPayment: boolean; payment: any };

    try {
      emailOrderDelivery = await this.extractEmailOrderDeliveryFromOrder(order);
      emailOrderPayment = await this.extractEmailOrderPaymentFromOrder(order);
    } catch (e) {
      throw new BlError("could not create email based on order" + e);
    }

    emailOrder.showDelivery = emailOrderDelivery.showDelivery;
    emailOrder.delivery = emailOrderDelivery.delivery;

    if (emailOrder.delivery) {
      emailOrder.totalAmount =
        order.amount + emailOrderDelivery.delivery["amount"];
    }

    emailOrder.showPayment = emailOrderPayment.showPayment;
    emailOrder.payment = emailOrderPayment.payment;

    return Promise.resolve(emailOrder);
  }

  private shouldShowDeadline(order: Order) {
    return order.orderItems.some(
      (orderItem) => orderItem.type === "rent" || orderItem.type === "extend"
    );
  }

  private extractEmailOrderPaymentFromOrder(
    order: Order
  ): Promise<{ payment: any; showPayment: boolean }> {
    if (!Array.isArray(order.payments) || !order.payments.length) {
      return Promise.resolve({ payment: null, showPayment: false });
    }

    const paymentPromises: Promise<Payment>[] = order.payments.map((payment) =>
      this._paymentStorage.get(
        typeof payment === "string" ? payment : payment.id
      )
    );

    return Promise.all(paymentPromises)
      .then((payments: Payment[]) => {
        const emailPayment = {
          total: payments.reduce(
            (subTotal, payment) => subTotal + payment.amount,
            0
          ),
          currency: this.defaultCurrency,
          taxAmount: 0,
          payments: payments.map((payment) =>
            this.paymentToEmailPayment(payment)
          ),
        };

        if (
          emailPayment.payments[0] &&
          emailPayment.payments[0].info &&
          emailPayment.payments[0].info["orderDetails"]
        ) {
          emailPayment.currency =
            emailPayment.payments[0].info["orderDetails"].currency;
        }

        return { payment: emailPayment, showPayment: true };
      })
      .catch((getPaymentsError) => {
        throw getPaymentsError;
      });
  }

  private extractEmailOrderDeliveryFromOrder(
    order: Order
  ): Promise<{ delivery: any; showDelivery: boolean }> {
    const deliveryId = order.delivery as string;
    if (!order.delivery || !deliveryId.length) {
      return Promise.resolve({ delivery: null, showDelivery: false });
    }

    return this._deliveryStorage
      .get(deliveryId)
      .then((delivery: Delivery) => {
        return delivery.method !== "bring"
          ? { delivery: null, showDelivery: false }
          : {
              delivery: this.deliveryToEmailDelivery(delivery),
              showDelivery: true,
            };
      })
      .catch((getDeliveryError: BlError) => {
        throw getDeliveryError;
      });
  }

  private paymentToEmailPayment(payment: Payment): any {
    if (!payment) {
      return null;
    }

    const paymentObj = {
      method: "",
      amount: "",
      cardInfo: null,
      taxAmount: !isNaN(payment.taxAmount)
        ? payment.taxAmount.toString()
        : null,
      paymentId: "",
      status: this.translatePaymentConfirmed(),
      creationTime: payment.creationTime
        ? dateService.format(
            payment.creationTime,
            "Europe/Oslo",
            this.standardTimeFormat
          )
        : null,
    };

    if (payment.method === "dibs") {
      if (payment.info) {
        const paymentInfo: DibsEasyPayment = payment.info as DibsEasyPayment;
        if (paymentInfo.paymentDetails) {
          if (paymentInfo.paymentDetails.paymentMethod) {
            paymentObj.method = paymentInfo.paymentDetails.paymentMethod;
          }

          if (paymentInfo.paymentDetails.cardDetails?.maskedPan) {
            paymentObj.cardInfo = `***${this.stripTo4LastDigits(
              paymentInfo.paymentDetails.cardDetails.maskedPan
            )}`;
          }
        }

        if (paymentInfo.orderDetails?.amount) {
          paymentObj.amount = (
            parseInt(paymentInfo.orderDetails.amount.toString()) / 100
          ).toString();
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
    return {
      method: delivery.method,
      currency: this.defaultCurrency,
      amount: delivery.amount,
      address: delivery.info["shipmentAddress"]
        ? `${delivery.info["shipmentAddress"].name}, ${delivery.info["shipmentAddress"].address}, ${delivery.info["shipmentAddress"].postalCode} ${delivery.info["shipmentAddress"].postalCity}`
        : null,
      trackingNumber: delivery.info["trackingNumber"],
      estimatedDeliveryDate: delivery.info["estimatedDelivery"]
        ? moment(delivery.info["estimatedDelivery"])
            .utcOffset(this.utcOffset)
            .format(this.standardDayFormat)
        : "",
    };
  }

  private orderItemsToEmailItems(
    orderItems: OrderItem[]
  ): { title: string; status: string; deadline?: string; price?: string }[] {
    return orderItems.map((orderItem) => ({
      title: orderItem.title,
      status: this.translateOrderItemType(orderItem.type, orderItem.handout),
      deadline:
        orderItem.type === "rent" || orderItem.type === "extend"
          ? dateService.toPrintFormat(orderItem.info.to, "Europe/Oslo")
          : null,
      price:
        orderItem.type !== "return" && orderItem.amount
          ? orderItem.amount.toString()
          : null,
    }));
  }

  private stripTo4LastDigits(cardNum: string) {
    return cardNum && cardNum.length > 4 ? cardNum.slice(-4) : cardNum;
  }

  private translatePaymentConfirmed(): string {
    return this.localeSetting === "nb" ? "bekreftet" : "confirmed";
  }

  private translateOrderItemType(
    orderItemType: OrderItemType,
    handout?: boolean
  ): string {
    if (this.localeSetting === "nb") {
      const translations = {
        rent: "lån",
        return: "returnert",
        extend: "forlenget",
        cancel: "kansellert",
        buy: "kjøp",
        "partly-payment": "delbetaling",
        buyback: "tilbakekjøp",
        buyout: "utkjøp",
      };
      return `${translations[orderItemType] ?? orderItemType}${
        handout && orderItemType !== "return" ? " - utlevert" : ""
      }`;
    }

    return orderItemType;
  }

  private async shouldSendAgreement(
    order: Order,
    customerDetail: UserDetail,
    branchId: string
  ): Promise<boolean> {
    const onlyHandout = order.orderItems[0].handout;
    const rentFound = order.orderItems.some(
      (orderItem) => orderItem.type === "rent"
    );

    if (onlyHandout) {
      return Promise.resolve(false);
    }

    if (!rentFound) {
      return Promise.resolve(false);
    }

    if (customerDetail.dob) {
      if (moment(customerDetail.dob).isValid()) {
        if (
          moment(customerDetail.dob).isAfter(
            moment(new Date()).subtract(18, "years")
          )
        ) {
          return Promise.resolve(true); // the user is under the age of 18
        }
      }
    }

    // eslint-disable-next-line no-useless-catch
    try {
      return await this.isBranchResponsible(branchId);
    } catch (e) {
      throw e;
    }
  }

  private isBranchResponsible(branchId: string): Promise<boolean> {
    return this._branchStorage
      .get(branchId)
      .then((branch: Branch) => {
        return branch.paymentInfo.responsible;
      })
      .catch((getBranchError: BlError) => {
        throw new BlError("could not get branch").add(getBranchError);
      });
  }
}
