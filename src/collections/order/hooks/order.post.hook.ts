import { Hook } from "../../../hook/hook";
import {
  BlError,
  Order,
  UserDetail,
  Payment,
  Delivery,
  Branch,
  Item,
  AccessToken,
} from "@boklisten/bl-model";
import { OrderValidator } from "../helpers/order-validator/order-validator";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { orderSchema } from "../order.schema";
import { OrderHookBefore } from "./order-hook-before";
import { isNullOrUndefined } from "util";
import { deliverySchema } from "../../delivery/delivery.schema";

export class OrderPostHook extends Hook {
  private orderValidator: OrderValidator;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private orderStorage: BlDocumentStorage<Order>;
  private orderHookBefore: OrderHookBefore;
  private deliveryStorage?: BlDocumentStorage<Delivery>;

  constructor(
    orderValidator?: OrderValidator,
    orderHookBefore?: OrderHookBefore,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    orderStorage?: BlDocumentStorage<Order>,
    deliveryStorage?: BlDocumentStorage<Delivery>
  ) {
    super();
    this.orderValidator = orderValidator
      ? orderValidator
      : new OrderValidator();
    this.orderHookBefore = orderHookBefore
      ? orderHookBefore
      : new OrderHookBefore();
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage("orders", orderSchema);
    this.deliveryStorage = deliveryStorage
      ? deliveryStorage
      : new BlDocumentStorage("deliveries", deliverySchema);
  }

  public before(requestBody: any): Promise<boolean> {
    return this.orderHookBefore.validate(requestBody);
  }

  public after(orders: Order[], accessToken?: AccessToken): Promise<Order[]> {
    if (isNullOrUndefined(accessToken) || accessToken.sub.length <= 0) {
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

    return this.validateOrder(order).then((validatedOrder: Order) => {
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
