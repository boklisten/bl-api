import {
  Order,
  CustomerItem,
  BlError,
  AccessToken,
  UserDetail,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { orderSchema } from "../../order.schema";
import { PaymentHandler } from "../../../payment/helpers/payment-handler";
import { userDetailSchema } from "../../../user-detail/user-detail.schema";
import { Messenger } from "../../../../messenger/messenger";
import { CustomerItemHandler } from "../../../customer-item/helpers/customer-item-handler";
import { OrderItemMovedFromOrderHandler } from "../order-item-moved-from-order-handler/order-item-moved-from-order-handler";
import { Matcher } from "../../../match/helpers/matcher/matcher";
import { BlCollectionName } from "../../../bl-collection";

export class OrderPlacedHandler {
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
    private _matcher?: Matcher
  ) {
    this.orderStorage =
      orderStorage ??
      new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this.paymentHandler = paymentHandler ?? new PaymentHandler();
    this.userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this._messenger = messenger ?? new Messenger();
    this._customerItemHandler =
      customerItemHandler ?? new CustomerItemHandler();
    this._orderItemMovedFromOrderHandler =
      orderItemMovedFromOrderHandler ?? new OrderItemMovedFromOrderHandler();

    this._matcher = this._matcher ?? new Matcher();
  }

  public async placeOrder(
    order: Order,
    accessToken: AccessToken
  ): Promise<Order> {
    try {
      const payments = await this.paymentHandler.confirmPayments(
        order,
        accessToken
      );

      const paymentIds = payments.map((payment) => payment.id);

      const placedOrder = await this.orderStorage.update(
        order.id,
        { placed: true, payments: paymentIds },
        {
          id: accessToken.sub,
          permission: accessToken.permission,
        }
      );

      await this.updateCustomerItemsIfPresent(placedOrder, accessToken);
      await this._orderItemMovedFromOrderHandler.updateOrderItems(placedOrder);
      await this.updateUserDetailWithPlacedOrder(placedOrder, accessToken);
      this.sendOrderConfirmationMail(placedOrder);

      return placedOrder;
    } catch (e) {
      throw new BlError("could not update order: " + e).add(e);
    }
  }

  private async updateCustomerItemsIfPresent(
    order: Order,
    accessToken: AccessToken
  ): Promise<Order> {
    // eslint-disable-next-line no-useless-catch
    try {
      for (const orderItem of order.orderItems) {
        if (
          orderItem.type === "extend" ||
          orderItem.type === "return" ||
          orderItem.type === "buyout" ||
          orderItem.type === "buyback" ||
          orderItem.type === "cancel"
        ) {
          let customerItemId = null;

          if (orderItem.info && orderItem.info.customerItem) {
            customerItemId = orderItem.info.customerItem;
          } else if (orderItem.customerItem) {
            customerItemId = orderItem.customerItem;
          }

          if (customerItemId !== null) {
            if (orderItem.type === "extend") {
              await this._customerItemHandler.extend(
                customerItemId,
                orderItem,
                order.branch as string,
                order.id
              );
            } else if (orderItem.type === "buyout") {
              await this._customerItemHandler.buyout(
                customerItemId,
                order.id,
                orderItem
              );
            } else if (orderItem.type === "buyback") {
              await this._customerItemHandler.buyback(
                customerItemId,
                order.id,
                orderItem
              );
            } else if (orderItem.type === "cancel") {
              await this._customerItemHandler.cancel(
                customerItemId,
                order.id,
                orderItem
              );
            } else if (orderItem.type === "return") {
              await this._customerItemHandler.return(
                customerItemId,
                order.id,
                orderItem,
                order.branch as string,
                accessToken.details
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
    accessToken: AccessToken
  ): Promise<boolean> {
    if (!order?.customer) {
      return Promise.resolve(true);
    }
    return new Promise((resolve, reject) => {
      this.userDetailStorage
        .get(order.customer as string)
        .then((userDetail: UserDetail) => {
          const orders: string[] = userDetail.orders
            ? (userDetail.orders as string[])
            : [];

          if (!orders.includes(order.id)) {
            orders.push(order.id);

            this.userDetailStorage
              .update(
                order.customer as string,
                { orders: orders },
                { id: accessToken.sub, permission: accessToken.permission }
              )
              .then(() => {
                resolve(true);
              })
              .catch(() => {
                reject(
                  new BlError("could not update userDetail with placed order")
                );
              });
          } else {
            resolve(true);
          }
        })
        .catch((getUserDetailError: BlError) => {
          reject(
            new BlError(`customer "${order.customer}" not found`).add(
              getUserDetailError
            )
          );
        });
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
        .catch();
    }
  }
}
