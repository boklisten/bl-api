import { isNullOrUndefined } from "util";

import { BlError, CustomerItem } from "@boklisten/bl-model";

import { BlDocumentStorage } from "../../../storage/blDocumentStorage";

export class CustomerItemValidator {
  // eslint-disable-next-line
  constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>) {}

  public validate(customerItem: CustomerItem): Promise<boolean> {
    if (isNullOrUndefined(customerItem)) {
      return Promise.reject(new BlError("customerItem is undefined"));
    }

    return Promise.resolve(true);
  }
}
