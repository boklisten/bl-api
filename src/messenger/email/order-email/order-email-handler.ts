import {EmailHandler, EmailLog} from '@wizardcoder/bl-email';
import {OrderItemType} from '@wizardcoder/bl-model/dist/order/order-item/order-item-type';
import {
  Delivery,
  Order,
  OrderItem,
  Payment,
  UserDetail,
  BlError,
  CustomerItem,
  Branch,
} from '@wizardcoder/bl-model';
import {EMAIL_SETTINGS} from '../email-settings';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {paymentSchema} from '../../../collections/payment/payment.schema';
import {deliverySchema} from '../../../collections/delivery/delivery.schema';
import {EmailSetting} from '@wizardcoder/bl-email/dist/ts/template/email-setting';
import {EmailOrder} from '@wizardcoder/bl-email/dist/ts/template/email-order';
import {EmailUser} from '@wizardcoder/bl-email/dist/ts/template/email-user';
import {isNullOrUndefined} from 'util';
import {DibsEasyPayment} from '../../../payment/dibs/dibs-easy-payment/dibs-easy-payment';
import moment = require('moment-timezone');
import {branchItemSchema} from '../../../collections/branch-item/branch-item.schema';
import {branchSchema} from '../../../collections/branch/branch.schema';
import {dateService} from '../../../blc/date.service';

export class OrderEmailHandler {
  private defaultCurrency = 'NOK';
  private standardDayFormat = 'DD.MM.YY';
  private standardTimeFormat = 'DD.MM.YYYY HH.mm.ss';
  private localeSetting = 'nb';
  private noPaymentNoticeText =
    'Dette er kun en reservasjon, du har ikke betalt enda. Du betaler først når du kommer til oss på stand.';
  private agreementTextBlock =
    'Vedlagt i denne mailen ligger en kontrakt som du trenger å skrive under på for å få lånt bøkene. Kontrakten må du ha med deg når du kommer til oss på stand.';
  private guardianTextBlock = '';
  private utcOffset = 120;

  constructor(
    private _emailHandler: EmailHandler,
    private _deliveryStorage?: BlDocumentStorage<Delivery>,
    private _paymentStorage?: BlDocumentStorage<Payment>,
    private _branchStorage?: BlDocumentStorage<Branch>,
  ) {
    this._deliveryStorage = _deliveryStorage
      ? _deliveryStorage
      : new BlDocumentStorage('deliveries', deliverySchema);
    this._paymentStorage = _paymentStorage
      ? _paymentStorage
      : new BlDocumentStorage('payments', paymentSchema);
    this._branchStorage = _branchStorage
      ? _branchStorage
      : new BlDocumentStorage('branches', branchSchema);
  }

  public async sendOrderReceipt(
    customerDetail: UserDetail,
    order: Order,
  ): Promise<EmailLog> {
    let emailSetting: EmailSetting = {
      toEmail: customerDetail.email,
      fromEmail: EMAIL_SETTINGS.types.receipt.fromEmail,
      subject: EMAIL_SETTINGS.types.receipt.subject,
      userId: customerDetail.id,
    };

    let branchId = order.branch as string;

    let withAgreement: boolean = await this.shouldSendAgreement(
      order,
      customerDetail,
      branchId,
    );

    let emailOrder: EmailOrder = await this.orderToEmailOrder(order);
    emailOrder.loan = withAgreement;

    let emailUser: EmailUser = {
      id: customerDetail.id,
      dob: !isNullOrUndefined(customerDetail.dob)
        ? dateService.toPrintFormat(customerDetail.dob, 'Europe/Oslo')
        : '',
      name: customerDetail.name,
      email: customerDetail.email,
      address: customerDetail.address,
    };

    if (withAgreement) {
      this.sendToGuardianIfUserIsUnder18(customerDetail, emailOrder, emailUser);

      emailSetting.textBlocks = [{text: this.agreementTextBlock}];
    }

    if (this.paymentNeeded(order)) {
      this.addNoPaymentProvidedNotice(emailSetting);
    }

    return this._emailHandler.sendOrderReceipt(
      emailSetting,
      emailOrder,
      emailUser,
      withAgreement,
    );
  }

  private paymentNeeded(order: Order): boolean {
    if (order.amount > 0) {
      if (isNullOrUndefined(order.payments) || order.payments.length <= 0) {
        return true;
      }
    }
    return false;
  }

  private addNoPaymentProvidedNotice(emailSetting: EmailSetting) {
    if (isNullOrUndefined(emailSetting.textBlocks)) {
      emailSetting.textBlocks = [];
    }

    emailSetting.textBlocks.push({
      text: this.noPaymentNoticeText,
      warning: true,
    });
  }

  private sendToGuardianIfUserIsUnder18(
    customerDetail: UserDetail,
    emailOrder: EmailOrder,
    emailUser: EmailUser,
  ) {
    if (moment(customerDetail.dob).isValid()) {
      if (
        moment(customerDetail.dob).isAfter(
          moment(new Date()).subtract(18, 'years'),
        )
      ) {
        if (customerDetail.guardian && customerDetail.guardian.email) {
          const emailSetting: EmailSetting = {
            toEmail: customerDetail.guardian.email,
            fromEmail: EMAIL_SETTINGS.types.receipt.fromEmail,
            subject: EMAIL_SETTINGS.types.receipt.subject,
            userId: customerDetail.id,
            userFullName: customerDetail.guardian.name,
          };

          emailSetting.textBlocks = [
            {
              text:
                'Du får denne e-posten fordi du er oppgitt som foresatt til ' +
                customerDetail.name +
                '. Vær vennlig å skriv under på kontrakten som' +
                ' ligger vedlagt og la eleven levere denne når bøkene skal leveres ut. Eleven vil ikke kunne hente ut bøker uten underskrift fra foresatt.',
            },
          ];

          this._emailHandler
            .sendOrderReceipt(emailSetting, emailOrder, emailUser, true)
            .then(() => {})
            .catch(() => {});
        }
      }
    }
  }

  public async orderToEmailOrder(order: Order): Promise<any> {
    let emailOrder: EmailOrder = {
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

    let emailOrderDelivery: {showDelivery: boolean; delivery: any};
    let emailOrderPayment: {showPayment: boolean; payment: any};

    try {
      emailOrderDelivery = await this.extractEmailOrderDeliveryFromOrder(order);
      emailOrderPayment = await this.extractEmailOrderPaymentFromOrder(order);
    } catch (e) {
      throw new BlError('could not create email based on order' + e);
    }

    emailOrder.showDelivery = emailOrderDelivery.showDelivery;
    emailOrder.delivery = emailOrderDelivery.delivery;

    if (emailOrder.delivery) {
      emailOrder.totalAmount =
        order.amount + emailOrderDelivery.delivery['amount'];
    }

    emailOrder.showPayment = emailOrderPayment.showPayment;
    emailOrder.payment = emailOrderPayment.payment;

    return Promise.resolve(emailOrder);
  }

  private shouldShowDeadline(order: Order) {
    for (let orderItem of order.orderItems) {
      if (orderItem.type === 'rent' || orderItem.type === 'extend') {
        return true;
      }
    }
    return false;
  }

  private extractEmailOrderPaymentFromOrder(
    order: Order,
  ): Promise<{payment: any; showPayment: boolean}> {
    if (isNullOrUndefined(order.payments) || order.payments.length <= 0) {
      return Promise.resolve({payment: null, showPayment: false});
    }

    let paymentPromiseArr: Promise<Payment>[] = [];

    for (let paymentId of order.payments) {
      let pId = typeof paymentId === 'string' ? paymentId : paymentId.id;
      paymentPromiseArr.push(this._paymentStorage.get(pId));
    }

    return Promise.all(paymentPromiseArr)
      .then((payments: Payment[]) => {
        let emailPayment = {
          total: 0,
          currency: '',
          taxAmount: 0,
          payments: [],
        };

        for (let payment of payments) {
          emailPayment.total += payment.amount;

          emailPayment.payments.push(this.paymentToEmailPayment(payment));
        }

        emailPayment.currency = this.defaultCurrency;

        if (emailPayment.payments[0] && emailPayment.payments[0].info) {
          if (emailPayment.payments[0].info['orderDetails']) {
            emailPayment.currency =
              emailPayment.payments[0].info['orderDetails'].currency;
          }
        }

        return {payment: emailPayment, showPayment: true};
      })
      .catch(getPaymentsError => {
        throw getPaymentsError;
      });
  }

  private extractEmailOrderDeliveryFromOrder(
    order: Order,
  ): Promise<{delivery: any; showDelivery: boolean}> {
    let deliveryId = order.delivery as string;
    if (isNullOrUndefined(order.delivery) || deliveryId.length <= 0) {
      return Promise.resolve({delivery: null, showDelivery: false});
    }

    return this._deliveryStorage
      .get(deliveryId)
      .then((delivery: Delivery) => {
        if (delivery.method !== 'bring') {
          // should only show delivery if user has ordered to mail
          return {delivery: null, showDelivery: false};
        }

        return {
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

    let paymentObj = {
      method: '',
      amount: '',
      cardInfo: null,
      taxAmount: !isNullOrUndefined(payment.taxAmount)
        ? payment.taxAmount.toString()
        : null,
      paymentId: '',
      status: this.translatePaymentConfirmed(),
      creationTime: !isNullOrUndefined(payment.creationTime)
        ? dateService.format(
            payment.creationTime,
            'Europe/Oslo',
            this.standardTimeFormat,
          )
        : null,
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
              paymentObj.cardInfo =
                '***' +
                this.stripTo4LastDigits(
                  paymentInfo.paymentDetails.cardDetails.maskedPan,
                );
            }
          }
        }

        if (paymentInfo.orderDetails) {
          if (paymentInfo.orderDetails.amount) {
            paymentObj.amount = (
              parseInt(paymentInfo.orderDetails.amount.toString()) / 100
            ).toString();
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
      currency: this.defaultCurrency,
      amount: delivery.amount,
      address: deliveryAddress,
      estimatedDeliveryDate: delivery.info['estimatedDelivery']
        ? moment(delivery.info['estimatedDelivery'])
            .utcOffset(this.utcOffset)
            .format(this.standardDayFormat)
        : '',
    };
  }

  private orderItemsToEmailItems(
    orderItems: OrderItem[],
  ): {title: string; status: string; deadline?: string; price?: string}[] {
    let emailItems: {
      title: string;
      status: string;
      deadline?: string;
      price?: string;
    }[] = [];

    for (const orderItem of orderItems) {
      emailItems.push({
        title: orderItem.title,
        status: this.translateOrderItemType(orderItem.type, orderItem.handout),
        deadline:
          orderItem.type === 'rent' || orderItem.type === 'extend'
            ? dateService.toPrintFormat(orderItem.info.to, 'Europe/Oslo')
            : null,
        price:
          orderItem.type !== 'return' && orderItem.amount
            ? orderItem.amount.toString()
            : null,
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

  private translateOrderItemType(
    orderItemType: OrderItemType,
    handout?: boolean,
  ): string {
    let trans = '';
    if (this.localeSetting === 'nb') {
      if (orderItemType === 'rent') {
        trans += 'lån';
      } else if (orderItemType === 'return') {
        trans += 'returnert';
      } else if (orderItemType === 'extend') {
        trans += 'forlenget';
      } else if (orderItemType === 'cancel') {
        trans += 'kansellert';
      } else if (orderItemType === 'buy') {
        trans += 'kjøp';
      }

      if (handout) {
        trans += ' - utlevert';
      }
      return trans;
    }

    return orderItemType;
  }

  private async shouldSendAgreement(
    order: Order,
    customerDetail: UserDetail,
    branchId: string,
  ): Promise<boolean> {
    let rentFound = false;
    let onlyHandout = false;

    for (let orderItem of order.orderItems) {
      if (orderItem.handout) {
        onlyHandout = true;
      } else {
        onlyHandout = false;
      }

      if (orderItem.type === 'rent') {
        rentFound = true;
      }
    }

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
            moment(new Date()).subtract(18, 'years'),
          )
        ) {
          return Promise.resolve(true); // the user is under the age of 18
        }
      }
    }

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
        throw new BlError('could not get branch').add(getBranchError);
      });
  }
}
