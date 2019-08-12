import {
  UserDetail,
  Order,
  Delivery,
  Payment,
  CustomerItem,
  OrderItem,
  Message,
  OrderItemType,
} from '@wizardcoder/bl-model';
import moment = require('moment');
import {logger} from '../../../logger/logger';
import {
  Recipient,
  Delivery as EmailDelivery,
  Payment as EmailPayment,
  ItemList,
  Order as EmailOrder,
  MessageOptions,
  PostOffice,
  postOffice,
} from '@wizardcoder/bl-post-office';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';

export class ReceiptEmailHandler {
  constructor(private _messageStorage: BlDocumentStorage<Message>) {}

  public async send(
    userDetail: UserDetail,
    order: Order,
    config: {delivery?: Delivery; payments?: Payment[]},
  ): Promise<any> {
    // should create a Message and store it in DB
    let message = this.createMessage(userDetail.id, order.id);

    message = await this._messageStorage.add(message, {
      id: 'SYSTEM',
      permission: 'super',
    });

    // should convert input to format fitting bl-post-office.send
    const emailDelivery = config.delivery
      ? this.deliveryToEmailDelivery(config.delivery)
      : null;
    const emailPayment = this.paymentToEmailPayment(
      order,
      config.delivery,
      config.payments,
    );
    const emailItemList = this.customerItemsToEmailItemList(order);
    const emailOrder = this.orderToEmailOrder(order);

    const emailRecipient: Recipient = {
      user_id: userDetail.id,
      email: userDetail.email,
      message_id: message.id,
      name: userDetail.name,
      itemList: emailItemList,
      delivery: emailDelivery,
      payment: emailPayment,
      order: emailOrder,
      settings: {
        display: {
          payment: true,
          leftToPay: true,
          delivery: true,
          deadline: true,
        },
      },
    };

    const messageOptions: MessageOptions = {
      type: 'receipt',
      subtype: 'none',
      mediums: {
        email: true,
      },
    };

    // should call bl-post-office.send
    try {
      await postOffice.send([emailRecipient], messageOptions);
    } catch (e) {
      logger.log('error', e);
    }
  }

  private createMessage(customerId: string, orderId: string): Message {
    return {
      id: '',
      messageType: 'receipt',
      messageSubtype: 'none',
      messageMethod: 'email',
      customerId: customerId,
      info: {
        orderId: orderId,
      },
    };
  }

  private deliveryToEmailDelivery(delivery: Delivery): EmailDelivery {
    return {
      method: delivery.method,
      expectedDeliveryDate: moment(delivery.info['estimatedDelivery']).format(
        'DD.MM.YY',
      ),
      unitPrice: this.toCurrency(delivery['amount'] as any),
      taxPercentage: '',
      totalTax: this.toCurrency(delivery['taxAmount'] as any),
      total: this.toCurrency(delivery['amount'] as any),
      address:
        delivery.info['shipmentAddress']['address'] +
        ', ' +
        delivery.info['shipmentAddress']['postalCode'] +
        ' ' +
        delivery.info['shipmentAddress']['postalCity'],
    };
  }

  private paymentToEmailPayment(
    order: Order,
    delivery: Delivery,
    payments: Payment[],
  ): EmailPayment {
    let deliveryAmount = delivery ? delivery.amount : 0;
    let emailPayment: EmailPayment = {
      total: this.toCurrency(
        order.amount + this.calculateTotalLeftToPay(order) + deliveryAmount,
      ),
      totalPayed: this.toCurrency(order.amount + deliveryAmount),
      reservation: payments.length <= 0 ? true : false,
      payments: [],
    };

    for (let payment of payments) {
      let cardNumber = '****';
      let paymentMethod = '';
      if (
        payment.info &&
        payment.info['paymentDetails'] &&
        payment.info['paymentDetails']['cardDetails'] &&
        payment.info['paymentDetails']['cardDetails']['maskedPan']
      ) {
        cardNumber += this.stripTo4LastDigits(
          payment.info['paymentDetails']['cardDetails']['maskedPan'],
        );
      }

      if (
        payment.info &&
        payment.info['paymentDetails'] &&
        payment.info['paymentDetails']['paymentMethod']
      ) {
        paymentMethod = payment.info['paymentDetails']['paymentMethod'];
      }

      emailPayment.payments.push({
        id: payment.id,
        amount: this.toCurrency(payment.amount),
        method: paymentMethod,
        cardNumber: cardNumber,
        status: 'bekreftet',
      });
    }
    return emailPayment;
  }

  private orderToEmailOrder(order: Order): EmailOrder {
    return {
      id: order.id,
    };
  }

  private toCurrency(num: any): string {
    return num + ' NOK';
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

  private translateOrderItemType(orderItemType: OrderItemType): string {
    switch (orderItemType) {
      case 'partly-payment':
        return 'delbetaling';
      case 'rent':
        return 'lån';
      case 'loan':
        return 'lån';
      case 'buy':
        return 'kjøp';
      case 'sell':
        return 'solgt';
      case 'buyback':
        return 'tilbakekjøp';
      default:
        return '';
    }
  }

  private customerItemsToEmailItemList(order: Order): ItemList {
    let summary = {
      total: this.toCurrency(order.amount),
      totalLeftToPay: '',
      totalTax: '',
      totalTaxLeftToPay: '0',
      taxPercentage: '',
      taxPercentageLeftToPay: '',
    };

    let totalLeftToPay = this.calculateTotalLeftToPay(order);
    let totalTax = 0;

    let items = [];

    for (const orderItem of order.orderItems) {
      let leftToPay = '-';

      if (orderItem.type === 'partly-payment') {
        leftToPay = orderItem.info['amountLeftToPay'];
      }

      totalTax += orderItem.taxAmount;

      items.push({
        id: orderItem.item,
        title: orderItem.title,
        deadline: moment(orderItem.info.to).format('DD.MM.YY'),
        amount: this.toCurrency(orderItem.amount),
        action: this.translateOrderItemType(orderItem.type),
        leftToPay: this.toCurrency(leftToPay),
      });
    }

    summary.totalLeftToPay = this.toCurrency(totalLeftToPay);
    summary.totalTax = this.toCurrency(totalTax);
    summary.totalTaxLeftToPay = this.toCurrency(summary.taxPercentageLeftToPay);

    return {
      summary: summary,
      items: items,
    };
  }

  private calculateTotalLeftToPay(order: Order): number {
    let total = 0;
    for (let orderItem of order.orderItems) {
      if (orderItem.type === 'partly-payment') {
        total += orderItem.info['amountLeftToPay'];
      }
    }
    return total;
  }
}
