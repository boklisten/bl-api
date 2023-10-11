import { isNullOrUndefined } from "util";

import { Delivery, Order, BlError } from "@boklisten/bl-model";

export class DeliveryBringHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
