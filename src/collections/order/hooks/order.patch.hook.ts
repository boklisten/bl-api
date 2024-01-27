import { AccessToken, BlError, Order, UserDetail } from "@boklisten/bl-model";

import { Hook } from "../../../hook/hook";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { OrderPlacedHandler } from "../helpers/order-placed-handler/order-placed-handler";
import { OrderValidator } from "../helpers/order-validator/order-validator";
import { orderSchema } from "../order.schema";

export class OrderPatchHook extends Hook {
  private orderValidator: OrderValidator;
  private orderStorage: BlDocumentStorage<Order>;
  private orderPlacedHandler: OrderPlacedHandler;

  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    orderStorage?: BlDocumentStorage<Order>,
    orderValidator?: OrderValidator,
    orderPlacedHandler?: OrderPlacedHandler,
  ) {
    super();
    this.orderStorage =
      orderStorage ??
      new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this.orderValidator = orderValidator ?? new OrderValidator();
    this.orderPlacedHandler = orderPlacedHandler ?? new OrderPlacedHandler();
  }

  override before(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    accessToken: AccessToken,
    id: string,
  ): Promise<boolean> {
    if (!body) {
      return Promise.reject(new BlError("body not defined"));
    }

    if (!accessToken) {
      return Promise.reject(new BlError("accessToken not defined"));
    }

    if (!id) {
      return Promise.reject(new BlError("id not defined"));
    }

    return Promise.resolve(true);
  }

  override after(orders: Order[], accessToken: AccessToken): Promise<Order[]> {
    if (orders.length > 1) {
      return Promise.reject(new BlError("can only patch one order at a time"));
    }

    if (!accessToken) {
      return Promise.reject(new BlError("accessToken not defined"));
    }

    const order = orders[0];

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (order.placed) {
        this.orderPlacedHandler
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          .placeOrder(order, accessToken)
          .then((placedOrder) => {
            resolve([placedOrder]);
          })
          .catch((orderPlacedError: BlError) => {
            reject(
              new BlError("order could not be placed").add(orderPlacedError),
            );
          });
      } else {
        this.orderValidator
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          .validate(order)
          .then(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            resolve([order]);
          })
          .catch((validationError: BlError) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (order.placed) {
              this.orderStorage
                .update(
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  order.id,
                  { placed: false },
                  {
                    id: accessToken.sub,
                    permission: accessToken.permission,
                  },
                )
                .then(() => {
                  return reject(
                    new BlError(
                      "validation of patch of order failed, order.placed is set to false",
                    ).add(validationError),
                  );
                })
                .catch((updateError: BlError) => {
                  return reject(
                    new BlError(
                      "could not set order.placed to false when order validation failed",
                    )
                      .add(updateError)
                      .add(validationError),
                  );
                });
            } else {
              return reject(
                new BlError("patch of order could not be validated").add(
                  validationError,
                ),
              );
            }
          });
      }
    });
  }
}
