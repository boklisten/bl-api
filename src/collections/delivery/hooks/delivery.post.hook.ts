import {
  BlError,
  Delivery,
  Item,
  Order,
  AccessToken,
} from "@boklisten/bl-model";

import { Hook } from "../../../hook/hook";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { orderSchema } from "../../order/order.schema";
import { BringDeliveryService } from "../helpers/deliveryBring/bringDelivery.service";
import { DeliveryHandler } from "../helpers/deliveryHandler/delivery-handler";
import { DeliveryValidator } from "../helpers/deliveryValidator/delivery-validator";

export class DeliveryPostHook extends Hook {
  private orderStorage: BlDocumentStorage<Order>;
  private deliveryValidator: DeliveryValidator;
  private deliveryHandler: DeliveryHandler;

  constructor(
    deliveryValidator?: DeliveryValidator,
    deliveryHandler?: DeliveryHandler,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    deliveryStorage?: BlDocumentStorage<Delivery>,
    orderStorage?: BlDocumentStorage<Order>,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    itemStorage?: BlDocumentStorage<Item>,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bringDeliveryService?: BringDeliveryService,
  ) {
    super();
    this.deliveryValidator = deliveryValidator ?? new DeliveryValidator();
    this.deliveryHandler = deliveryHandler ?? new DeliveryHandler();
    this.orderStorage =
      orderStorage ??
      new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
  }

  public override after(
    deliveries: Delivery[],
    accessToken?: AccessToken,
  ): Promise<Delivery[]> {
    if (!deliveries || deliveries.length <= 0) {
      return Promise.reject(new BlError("deliveries is empty or undefined"));
    }

    if (deliveries.length > 1) {
      return Promise.reject(new BlError("can not add more than one delivery"));
    }

    const delivery = deliveries[0];
    return new Promise((resolve, reject) => {
      this.orderStorage
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .get(delivery.order as string)
        .then((order: Order) => {
          this.deliveryValidator
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .validate(delivery, order)
            .then(() => {
              this.deliveryHandler
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                .updateOrderBasedOnMethod(delivery, order, accessToken)
                .then((updatedDelivery: Delivery) => {
                  return resolve([updatedDelivery]);
                })
                .catch((blError: BlError) => {
                  return reject(blError);
                });
            })
            .catch((blError: BlError) => {
              return reject(blError);
            });
        })
        .catch((blError: BlError) => {
          return reject(blError);
        });
    });
  }
}
