import { Hook } from "../../../hook/hook";
import {
  AccessToken,
  BlError,
  Order,
  UserDetail,
  Delivery,
} from "@boklisten/bl-model";
import { isNullOrUndefined } from "util";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { OrderValidator } from "../helpers/order-validator/order-validator";
import { orderSchema } from "../order.schema";
import { OrderPlacedHandler } from "../helpers/order-placed-handler/order-placed-handler";

export class OrderPatchHook extends Hook {
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private orderValidator: OrderValidator;
  private orderStorage: BlDocumentStorage<Order>;
  private orderPlacedHandler: OrderPlacedHandler;

  constructor(
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    orderStorage?: BlDocumentStorage<Order>,
    orderValidator?: OrderValidator,
    orderPlacedHandler?: OrderPlacedHandler
  ) {
    super();
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage<UserDetail>("userdetails", userDetailSchema);
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage("orders", orderSchema);
    this.orderValidator = orderValidator
      ? orderValidator
      : new OrderValidator();
    this.orderPlacedHandler = orderPlacedHandler
      ? orderPlacedHandler
      : new OrderPlacedHandler();
  }

  before(body: any, accessToken: AccessToken, id: string): Promise<boolean> {
    if (body === {} || typeof body == "undefined" || isNullOrUndefined(body)) {
      return Promise.reject(new BlError("body not defined"));
    }

    if (isNullOrUndefined(accessToken)) {
      return Promise.reject(new BlError("accessToken not defined"));
    }

    if (isNullOrUndefined(id)) {
      return Promise.reject(new BlError("id not defined"));
    }

    return Promise.resolve(true);
  }

  after(orders: Order[], accessToken: AccessToken): Promise<Order[]> {
    if (orders.length > 1) {
      return Promise.reject(new BlError("can only patch one order at a time"));
    }

    if (isNullOrUndefined(accessToken)) {
      return Promise.reject(new BlError("accessToken not defined"));
    }

    const order = orders[0];

    return new Promise((resolve, reject) => {
      if (order.placed) {
        this.orderPlacedHandler
          .placeOrder(order, accessToken)
          .then((placedOrder) => {
            resolve([placedOrder]);
          })
          .catch((orderPlacedError: BlError) => {
            reject(
              new BlError("order could not be placed").add(orderPlacedError)
            );
          });
      } else {
        this.orderValidator
          .validate(order)
          .then(() => {
            resolve([order]);
          })
          .catch((validationError: BlError) => {
            if (order.placed) {
              this.orderStorage
                .update(
                  order.id,
                  { placed: false },
                  {
                    id: accessToken.sub,
                    permission: accessToken.permission,
                  }
                )
                .then(() => {
                  return reject(
                    new BlError(
                      "validation of patch of order failed, order.placed is set to false"
                    ).add(validationError)
                  );
                })
                .catch((updateError: BlError) => {
                  return reject(
                    new BlError(
                      "could not set order.placed to false when order validation failed"
                    )
                      .add(updateError)
                      .add(validationError)
                  );
                });
            } else {
              return reject(
                new BlError("patch of order could not be validated").add(
                  validationError
                )
              );
            }
          });
      }
    });
  }
}
