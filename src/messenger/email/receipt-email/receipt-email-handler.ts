import {
  UserDetail,
  Order,
  Delivery,
  Payment,
  CustomerItem,
  OrderItem,
  Message,
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
    const emailPayment = this.paymentToEmailPayment(order, config.payments);
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
      expectedDeliveryDate: delivery.info['estimatedDelivery'],
      unitPrice: '',
      taxPercentage: '',
      totalTax: '',
      total: '',
      address: '',
    };
  }

  private paymentToEmailPayment(
    order: Order,
    payments: Payment[],
  ): EmailPayment {
    let emailPayment: EmailPayment = {
      total: (order.amount + this.calculateTotalLeftToPay(order)).toString(),
      totalPayed: order.amount.toString(),
      reservation: payments.length <= 0 ? true : false,
      payments: [],
    };

    for (let payment of payments) {
      let cardNumber = '';
      if (
        payment.info &&
        payment.info['paymentDetails'] &&
        payment.info['paymentDetails']['maskedPan']
      ) {
        cardNumber = '****' + payment.info['paymentDetails']['maskedPan'];
      }
      emailPayment.payments.push({
        id: payment.id,
        amount: payment.amount.toString(),
        method: payment.method,
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

  private customerItemsToEmailItemList(order: Order): ItemList {
    let summary = {
      total: order.amount.toString(),
      totalLeftToPay: '',
      totalTax: '',
      taxPercentage: '',
      taxPercentageLeftToPay: '',
    };

    let totalLeftToPay = this.calculateTotalLeftToPay(order);
    let totalTax = 0;

    let items = [];

    for (const orderItem of order.orderItems) {
      let leftToPay = '-';

      if (orderItem.type === 'partly-payment') {
        leftToPay = orderItem.info['amountLeftToPay'].toString();
      }

      totalTax += orderItem.taxAmount;

      items.push({
        id: orderItem.item,
        title: orderItem.title,
        deadline: moment(orderItem.info.to).format('DD.MM.YY'),
        amount: orderItem.amount,
        action: orderItem.type,
        leftToPay: leftToPay,
      });
    }

    summary.totalLeftToPay = totalLeftToPay.toString();
    summary.totalTax = totalTax.toString();

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
