import {
  Order,
  OrderItem,
  CustomerItem,
  BlError,
  Branch,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../../../storage/blDocumentStorage";
import { customerItemSchema } from "../../../../../customer-item/customer-item.schema";
import { isNullOrUndefined } from "util";

export class OrderItemExtendValidator {
  private customerItemStorage: BlDocumentStorage<CustomerItem>;

  constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>) {
    this.customerItemStorage = customerItemStorage
      ? customerItemStorage
      : new BlDocumentStorage("customeritems", customerItemSchema);
  }

  public async validate(
    branch: Branch,
    orderItem: OrderItem
  ): Promise<boolean> {
    try {
      this.validateFields(orderItem);
      this.checkPeriodType(orderItem, branch);
      await this.validateCustomerItem(branch, orderItem);
    } catch (e) {
      if (e instanceof BlError) {
        return Promise.reject(e);
      }
      return Promise.reject(
        new BlError(
          'unknown error, could not validate orderItem.type "extend"'
        ).store("error", e)
      );
    }

    return Promise.resolve(true);
  }

  private validateFields(orderItem: OrderItem): boolean {
    if (orderItem.type !== "extend") {
      throw new BlError(`orderItem.type "${orderItem.type}" is not "extend"`);
    }

    if (isNullOrUndefined(orderItem.info)) {
      throw new BlError("orderItem.info is not defined");
    }

    if (isNullOrUndefined(orderItem.info.customerItem)) {
      throw new BlError("orderItem.info.customerItem is not defined");
    }

    return true;
  }

  private validateCustomerItem(
    branch: Branch,
    orderItem: OrderItem
  ): Promise<boolean> {
    return this.customerItemStorage
      .get(orderItem.info.customerItem as string)
      .then((customerItem: CustomerItem) => {
        let totalOfSelectedPeriod = 0;
        if (customerItem.periodExtends) {
          for (let periodExtend of customerItem.periodExtends) {
            if (periodExtend.periodType === orderItem.info.periodType) {
              totalOfSelectedPeriod += 1;
            }
          }

          for (let extendPeriod of branch.paymentInfo.extendPeriods) {
            if (extendPeriod.type === orderItem.info.periodType) {
              if (totalOfSelectedPeriod > extendPeriod.maxNumberOfPeriods) {
                throw new BlError(
                  "orderItem can not be extended any more times"
                );
              }
            }
          }

          return true;
        }
      })
      .catch((blError: BlError) => {
        return Promise.reject(blError);
      });
  }

  private checkPeriodType(orderItem: OrderItem, branch: Branch) {
    if (isNullOrUndefined(branch.paymentInfo.extendPeriods)) {
      throw new BlError("the branch has no extendPeriods defined");
    }

    for (let extendPeriod of branch.paymentInfo.extendPeriods) {
      if (extendPeriod.type === orderItem.info.periodType) {
        return true;
      }
    }

    throw new BlError(
      `orderItem.info.periodType is "${orderItem.info.periodType}" but it is not allowed by branch`
    );
  }
}
