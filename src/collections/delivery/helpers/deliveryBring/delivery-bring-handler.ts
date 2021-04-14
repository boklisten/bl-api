import {
  Delivery,
  Order,
  BlError,
  DeliveryInfoBring,
} from "@boklisten/bl-model";

import { isNullOrUndefined } from "util";

export class DeliveryBringHandler {
  constructor() {}

  public validate(delivery: Delivery, order: Order): Promise<boolean> {
    if (isNullOrUndefined(delivery.info)) {
      return Promise.reject(new BlError("delivery.info not defined"));
    }

    if (isNullOrUndefined(delivery.info["from"])) {
      return Promise.reject(new BlError("delivery.info.from not defined"));
    }

    if (isNullOrUndefined(delivery.info["to"])) {
      return Promise.reject(new BlError("delivery.info.to not defined"));
    }

    return Promise.resolve(true);
  }
}
