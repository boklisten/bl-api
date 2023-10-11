import { Hook } from "../../../hook/hook";
import {
  BlError,
  Delivery,
  Item,
  Order,
  AccessToken,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { orderSchema } from "../../order/order.schema";
import { BringDeliveryService } from "../helpers/deliveryBring/bringDelivery.service";
import { DeliveryValidator } from "../helpers/deliveryValidator/delivery-validator";
import { DeliveryHandler } from "../helpers/deliveryHandler/delivery-handler";
import { BlCollectionName } from "../../bl-collection";

export class DeliveryPostHook extends Hook {
  private orderStorage: BlDocumentStorage<Order>;
  private deliveryValidator: DeliveryValidator;
  private deliveryHandler: DeliveryHandler;

  constructor(
    deliveryValidator?: DeliveryValidator,
    deliveryHandler?: DeliveryHandler,
    deliveryStorage?: BlDocumentStorage<Delivery>,
    orderStorage?: BlDocumentStorage<Order>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    itemStorage?: BlDocumentStorage<Item>,
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
        .get(delivery.order as string)
        .then((order: Order) => {
          this.deliveryValidator
            .validate(delivery, order)
            .then(() => {
              this.deliveryHandler
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
