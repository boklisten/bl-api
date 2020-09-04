import {
  Order,
  CustomerItem,
  OrderItem,
  BlError,
  AccessToken,
  Payment,
  UserDetail,
  Delivery,
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {customerItemSchema} from '../../../customer-item/customer-item.schema';
import {orderSchema} from '../../order.schema';
import {PaymentHandler} from '../../../payment/helpers/payment-handler';
import {userDetailSchema} from '../../../user-detail/user-detail.schema';
import {EmailService} from '../../../../messenger/email/email-service';
import {deliverySchema} from '../../../delivery/delivery.schema';
import {Messenger} from '../../../../messenger/messenger';
import {CustomerItemHandler} from '../../../customer-item/helpers/customer-item-handler';
import {OrderItemMovedFromOrderHandler} from '../order-item-moved-from-order-handler/order-item-moved-from-order-handler';
import {isNullOrUndefined} from 'util';
import {Matcher} from '../../../match/helpers/matcher/matcher';

export class OrderPlacedHandler {
  private customerItemStorage: BlDocumentStorage<CustomerItem>;
  private orderStorage: BlDocumentStorage<Order>;
  private paymentHandler: PaymentHandler;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private _customerItemHandler: CustomerItemHandler;
  private _orderItemMovedFromOrderHandler: OrderItemMovedFromOrderHandler;
  private _messenger: Messenger;

  constructor(
    customerItemStorage?: BlDocumentStorage<CustomerItem>,
    orderStorage?: BlDocumentStorage<Order>,
    paymentHandler?: PaymentHandler,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    messenger?: Messenger,
    customerItemHandler?: CustomerItemHandler,
    orderItemMovedFromOrderHandler?: OrderItemMovedFromOrderHandler,
    private _matcher?: Matcher,
  ) {
    this.customerItemStorage = customerItemStorage
      ? customerItemStorage
      : new BlDocumentStorage('customeritems', customerItemSchema);
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage('orders', orderSchema);
    this.paymentHandler = paymentHandler
      ? paymentHandler
      : new PaymentHandler();
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage('userdetails', userDetailSchema);
    this._messenger = messenger ? messenger : new Messenger();
    this._customerItemHandler = customerItemHandler
      ? customerItemHandler
      : new CustomerItemHandler();
    this._orderItemMovedFromOrderHandler = orderItemMovedFromOrderHandler
      ? orderItemMovedFromOrderHandler
      : new OrderItemMovedFromOrderHandler();

    this._matcher = this._matcher ? this._matcher : new Matcher();
  }

  public async placeOrder(
    order: Order,
    accessToken: AccessToken,
  ): Promise<Order> {
    let userDetail;

    try {
      userDetail = await this.userDetailStorage.get(order.customer as string);
    } catch (e) {
      userDetail = null;
    }

    try {
      const payments = await this.paymentHandler.confirmPayments(
        order,
        accessToken,
      );

      const paymentIds = payments.map(payment => payment.id);

      const placedOrder = await this.orderStorage.update(
        order.id,
        {placed: true, payments: paymentIds},
        {
          id: accessToken.sub,
          permission: accessToken.permission,
        },
      );

      await this.updateCustomerItemsIfPresent(placedOrder, accessToken);
      await this._orderItemMovedFromOrderHandler.updateOrderItems(placedOrder);
      await this.updateUserDetailWithPlacedOrder(placedOrder, accessToken);
      this.sendOrderConfirmationMail(placedOrder);

      return placedOrder;
    } catch (e) {
      throw new BlError('could not update order').add(e);
    }
  }

  private async updateCustomerItemsIfPresent(
    order: Order,
    accessToken: AccessToken,
  ): Promise<Order> {
    try {
      for (let orderItem of order.orderItems) {
        if (
          orderItem.type === 'extend' ||
          orderItem.type === 'return' ||
          orderItem.type === 'buyout' ||
          orderItem.type === 'buyback' ||
          orderItem.type === 'cancel'
        ) {
          let customerItemId = null;

          if (orderItem.info && orderItem.info.customerItem) {
            customerItemId = orderItem.info.customerItem;
          } else if (orderItem.customerItem) {
            customerItemId = orderItem.customerItem;
          }

          if (customerItemId !== null) {
            if (orderItem.type === 'extend') {
              await this._customerItemHandler.extend(
                customerItemId,
                orderItem,
                order.branch as string,
                order.id,
              );
            } else if (orderItem.type === 'buyout') {
              await this._customerItemHandler.buyout(
                customerItemId,
                order.id,
                orderItem,
              );
            } else if (orderItem.type === 'buyback') {
              await this._customerItemHandler.buyback(
                customerItemId,
                order.id,
                orderItem,
              );
            } else if (orderItem.type === 'cancel') {
              await this._customerItemHandler.cancel(
                customerItemId,
                order.id,
                orderItem,
              );
            } else if (orderItem.type === 'return') {
              await this._customerItemHandler.return(
                customerItemId,
                order.id,
                orderItem,
                order.branch as string,
                accessToken.details,
              );
            }
          }
        }
      }

      return Promise.resolve(order);
    } catch (e) {
      throw e;
    }
  }

  private updateUserDetailWithPlacedOrder(
    order: Order,
    accessToken: AccessToken,
  ): Promise<boolean> {
    if (isNullOrUndefined(order.customer) || !order.customer) {
      return Promise.resolve(true);
    }
    return new Promise((resolve, reject) => {
      this.userDetailStorage
        .get(order.customer as string)
        .then((userDetail: UserDetail) => {
          let orders: string[] = userDetail.orders
            ? (userDetail.orders as string[])
            : [];

          if (orders.indexOf(order.id) <= -1) {
            orders.push(order.id);

            this.userDetailStorage
              .update(
                order.customer as string,
                {orders: orders},
                {id: accessToken.sub, permission: accessToken.permission},
              )
              .then((updatedUserDetail: UserDetail) => {
                resolve(true);
              })
              .catch((updateUserDetailError: BlError) => {
                reject(
                  new BlError('could not update userDetail with placed order'),
                );
              });
          } else {
            resolve(true);
            //reject(new BlError('the order was already in userDetails'));
          }
        })
        .catch((getUserDetailError: BlError) => {
          reject(
            new BlError(`customer "${order.customer}" not found`).add(
              getUserDetailError,
            ),
          );
        });
    });
  }

  private updateLastOrderItemsIfMovedFromOrder(
    order: Order,
    accessToken: AccessToken,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let movedFromOrderItems: {
        itemId: string;
        movedFromOrderId: string;
        movedToOrderId: string;
      }[] = [];

      reject(new Error(''));
    });
  }

  private sendOrderConfirmationMail(order: Order) {
    if (!order.notification || order.notification.email) {
      this.userDetailStorage
        .get(order.customer as string)
        .then((customerDetail: UserDetail) => {
          if (order.handoutByDelivery) {
            this._messenger.sendDeliveryInformation(customerDetail, order);
          } else {
            this._messenger.orderPlaced(customerDetail, order);
          }
        })
        .catch(getCustomerDetailError => {});
    } else {
    }
  }
}
