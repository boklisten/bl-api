import { BlError, CustomerItem } from "@boklisten/bl-model";

import { CustomerItemActive } from "./customer-item-active";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { customerItemSchema } from "../customer-item.schema";

export class CustomerHaveActiveCustomerItems {
  private queryBuilder: SEDbQueryBuilder;
  private customerItemActive: CustomerItemActive;

  constructor(private _customerItemStorage?: BlDocumentStorage<CustomerItem>) {
    this._customerItemStorage =
      this._customerItemStorage ??
      new BlDocumentStorage(BlCollectionName.CustomerItems, customerItemSchema);
    this.queryBuilder = new SEDbQueryBuilder();
    this.customerItemActive = new CustomerItemActive();
  }

  public async haveActiveCustomerItems(userId: string): Promise<boolean> {
    const dbQuery = this.queryBuilder.getDbQuery({ customer: userId }, [
      { fieldName: "customer", type: "object-id" },
    ]);
    let customerItems: CustomerItem[];

    try {
      customerItems = await this._customerItemStorage.getByQuery(dbQuery);
    } catch (e) {
      if (e instanceof BlError) {
        if (e.getCode() == 702) {
          return false;
        }
      }
      throw e;
    }

    return customerItems.some((customerItem) =>
      this.customerItemActive.isActive(customerItem),
    );
  }
}
