import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlError, CustomerItem } from "@wizardcoder/bl-model";
import { customerItemSchema } from "../customer-item.schema";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { CustomerItemActive } from "./customer-item-active";

export class CustomerHaveActiveCustomerItems {
  private queryBuilder: SEDbQueryBuilder;
  private customerItemActive: CustomerItemActive;

  constructor(private _customerItemStorage?: BlDocumentStorage<CustomerItem>) {
    this._customerItemStorage = this._customerItemStorage
      ? this._customerItemStorage
      : new BlDocumentStorage("customeritems", customerItemSchema);
    this.queryBuilder = new SEDbQueryBuilder();
    this.customerItemActive = new CustomerItemActive();
  }

  public async haveActiveCustomerItems(userId: string): Promise<boolean> {
    const dbQuery = this.queryBuilder.getDbQuery({ customer: userId }, [
      { fieldName: "customer", type: "object-id" }
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

    for (let customerItem of customerItems) {
      if (this.customerItemActive.isActive(customerItem)) {
        return true;
      }
    }

    return false;
  }
}
