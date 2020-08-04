import { CustomerItem } from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { customerItemSchema } from "../customer-item.schema";
import { CustomerItemActive } from "./customer-item-active";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";

export class CustomerItemActiveBlid {
  private customerItemActive: CustomerItemActive;
  private dbQueryBuilder: SEDbQueryBuilder;

  constructor(private customerItemStorage?: BlDocumentStorage<CustomerItem>) {
    this.customerItemStorage = customerItemStorage
      ? customerItemStorage
      : new BlDocumentStorage<CustomerItem>(
          "customeritems",
          customerItemSchema
        );
    this.customerItemActive = new CustomerItemActive();
    this.dbQueryBuilder = new SEDbQueryBuilder();
  }

  /**
   * Checks if a blid is used by an active customerItem
   */
  async getActiveCustomerItems(blid: string): Promise<string[]> {
    const dbQuery = this.dbQueryBuilder.getDbQuery({ blid: blid }, [
      { fieldName: "blid", type: "string" }
    ]);

    const customerItems = await this.customerItemStorage.getByQuery(dbQuery);

    const activeCustomerItemIds = customerItems
      .filter(ci => {
        return this.customerItemActive.isActive(ci);
      })
      .map(ci => ci.id);

    if (!activeCustomerItemIds || activeCustomerItemIds.length <= 0) {
      return [];
    }

    return activeCustomerItemIds;
  }
}
