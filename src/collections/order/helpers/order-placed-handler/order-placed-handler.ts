import {
  AccessToken,
  BlError,
  CustomerItem,
  Order,
  UserDetail,
} from "@boklisten/bl-model";

import { logger } from "../../../../logger/logger";
import { Messenger } from "../../../../messenger/messenger";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../bl-collection";
import { CustomerItemHandler } from "../../../customer-item/helpers/customer-item-handler";
import { PaymentHandler } from "../../../payment/helpers/payment-handler";
import { userDetailSchema } from "../../../user-detail/user-detail.schema";
import { orderSchema } from "../../order.schema";
import { OrderItemMovedFromOrderHandler } from "../order-item-moved-from-order-handler/order-item-moved-from-order-handler";

export class OrderPlacedHandler {
  private orderStorage: BlDocumentStorage<Order>;
  private paymentHandler: PaymentHandler;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private _customerItemHandler: CustomerItemHandler;
  private _orderItemMovedFromOrderHandler: OrderItemMovedFromOrderHandler;
  private _messenger: Messenger;

  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    customerItemStorage?: BlDocumentStorage<CustomerItem>,
    orderStorage?: BlDocumentStorage<Order>,
    paymentHandler?: PaymentHandler,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    messenger?: Messenger,
    customerItemHandler?: CustomerItemHandler,
    orderItemMovedFromOrderHandler?: OrderItemMovedFromOrderHandler,
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
  }

  public async placeOrder(
    order: Order,
    accessToken: AccessToken,
  ): Promise<Order> {
    try {
      const payments = await this.paymentHandler.confirmPayments(
        order,
        accessToken,
      );

      const paymentIds = payments.map((payment) => payment.id);

      const placedOrder = await this.orderStorage.update(
        order.id,
        { placed: true, payments: paymentIds },
        {
          id: accessToken.sub,
          permission: accessToken.permission,
        },
      );

      await this.updateCustomerItemsIfPresent(placedOrder, accessToken);
      await this._orderItemMovedFromOrderHandler.updateOrderItems(placedOrder);
      await this.updateUserDetailWithPlacedOrder(placedOrder, accessToken);
      // Don't await to improve performance
      this.sendOrderConfirmationMail(placedOrder).catch((e) =>
        logger.warn(`could not send order confirmation mail: ${e}`),
      );

      return placedOrder;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new BlError("could not update order: " + e).add(e);
    }
  }

  private async updateCustomerItemsIfPresent(
    order: Order,
    accessToken: AccessToken,
  ): Promise<Order> {
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
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              customerItemId,
              orderItem,
              order.branch as string,
              order.id,
            );
          } else if (orderItem.type === "buyout") {
            await this._customerItemHandler.buyout(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              customerItemId,
              order.id,
              orderItem,
            );
          } else if (orderItem.type === "buyback") {
            await this._customerItemHandler.buyback(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              customerItemId,
              order.id,
              orderItem,
            );
          } else if (orderItem.type === "cancel") {
            await this._customerItemHandler.cancel(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              customerItemId,
              order.id,
              orderItem,
            );
          } else if (orderItem.type === "return") {
            await this._customerItemHandler.return(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
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
  }

  private updateUserDetailWithPlacedOrder(
    order: Order,
    accessToken: AccessToken,
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
                { id: accessToken.sub, permission: accessToken.permission },
              )
              .then(() => {
                resolve(true);
              })
              .catch(() => {
                reject(
                  new BlError("could not update userDetail with placed order"),
                );
              });
          } else {
            resolve(true);
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

  private async sendOrderConfirmationMail(order: Order): Promise<void> {
    if (order.notification && !order.notification.email) {
      return;
    }
    const customerDetail = await this.userDetailStorage.get(
      String(order.customer),
    );
    if (order.handoutByDelivery) {
      await this._messenger.sendDeliveryInformation(customerDetail, order);
    } else {
      await this._messenger.orderPlaced(customerDetail, order);
    }
  }
}
