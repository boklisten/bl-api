import { Hook } from "../../../hook/hook";
import {
  BlError,
  Order,
  UserDetail,
  Delivery,
  AccessToken,
} from "@boklisten/bl-model";
import { OrderValidator } from "../helpers/order-validator/order-validator";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { OrderHookBefore } from "./order-hook-before";

export class OrderPostHook extends Hook {
  private orderValidator: OrderValidator;
  private orderHookBefore: OrderHookBefore;

  constructor(
    orderValidator?: OrderValidator,
    orderHookBefore?: OrderHookBefore,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    orderStorage?: BlDocumentStorage<Order>,
    deliveryStorage?: BlDocumentStorage<Delivery>
  ) {
    super();
    this.orderValidator = orderValidator ?? new OrderValidator();
    this.orderHookBefore = orderHookBefore ?? new OrderHookBefore();
  }

  public override before(requestBody: any): Promise<boolean> {
    return this.orderHookBefore.validate(requestBody);
  }

  public override after(
    orders: Order[],
    accessToken?: AccessToken
  ): Promise<Order[]> {
    if (!accessToken || accessToken.sub.length <= 0) {
      return Promise.reject(
        new BlError(
          "accessToken was not specified when trying to process order"
        )
      );
    }

    if (!orders || orders.length <= 0) {
      return Promise.reject(new BlError("no orders provided").code(701));
    }

    if (orders.length > 1) {
      return Promise.reject(new BlError("orderIds included more than one id"));
    }

    const order = orders[0];

    return this.validateOrder(order).then(() => {
      return [order];
    });
  }

  private validateOrder(order: Order): Promise<Order> {
    return new Promise((resolve, reject) => {
      this.orderValidator
        .validate(order)
        .then(() => {
          if (order.placed) {
            return reject(
              new BlError("order.placed is set to true on post of order")
            );
          }

          resolve(order);
        })
        .catch((blError: BlError) => {
          return reject(blError);
        });
    });
  }
}
