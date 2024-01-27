import { CustomerItem } from "@boklisten/bl-model";

import { CustomerItemActive } from "./customer-item-active";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { customerItemSchema } from "../customer-item.schema";

export class CustomerItemActiveBlid {
  private customerItemActive: CustomerItemActive;
  private dbQueryBuilder: SEDbQueryBuilder;

  constructor(private customerItemStorage?: BlDocumentStorage<CustomerItem>) {
    this.customerItemStorage = customerItemStorage
      ? customerItemStorage
      : new BlDocumentStorage<CustomerItem>(
          BlCollectionName.CustomerItems,
          customerItemSchema,
        );
    this.customerItemActive = new CustomerItemActive();
    this.dbQueryBuilder = new SEDbQueryBuilder();
  }

  /**
   * Checks if a blid is used by an active customerItem
   */
  async getActiveCustomerItemIds(blid: string): Promise<string[]> {
    const activeCustomerItems = await this.getActiveCustomerItems(blid);
    return activeCustomerItems.map((customerItem) => customerItem.id);
  }

  async getActiveCustomerItems(blid: string): Promise<CustomerItem[]> {
    const dbQuery = this.dbQueryBuilder.getDbQuery({ blid: blid }, [
      { fieldName: "blid", type: "string" },
    ]);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const customerItems = await this.customerItemStorage.getByQuery(dbQuery);

    const activeCustomerItems = customerItems.filter((customerItem) =>
      this.customerItemActive.isActive(customerItem),
    );

    if (!activeCustomerItems || activeCustomerItems.length <= 0) {
      return [];
    }

    return activeCustomerItems;
  }
}
