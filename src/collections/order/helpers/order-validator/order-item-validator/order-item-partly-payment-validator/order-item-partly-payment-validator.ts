import { OrderItem, Item, Branch, BlError } from "@boklisten/bl-model";
import { isNullOrUndefined } from "util";

export class OrderItemPartlyPaymentValidator {
  public validate(
    orderItem: OrderItem,
    Item: Item,
    branch: Branch
  ): Promise<boolean> {
    if (orderItem.type !== "partly-payment") {
      return Promise.reject(
        new BlError("orderItem not of type 'partly-payment'")
      );
    }

    try {
      this.validateFields(orderItem);
    } catch (e) {
      return Promise.reject(e);
    }

    if (!this.isPeriodSupported(orderItem.info.periodType, branch)) {
      return Promise.reject(
        new BlError(
          `partly-payment period "${orderItem.info.periodType}" not supported on branch`
        )
      );
    }

    return new Promise((resolve) => {
      resolve(true);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isPeriodSupported(period: any, branch: Branch) {
    if (branch.paymentInfo && branch.paymentInfo.partlyPaymentPeriods) {
      for (const partlyPaymentPeriod of branch.paymentInfo
        .partlyPaymentPeriods) {
        if (partlyPaymentPeriod.type === period) {
          return true;
        }
      }
    }

    return false;
  }

  private validateFields(orderItem: OrderItem) {
    if (isNullOrUndefined(orderItem.info)) {
      throw new BlError("orderItem.info not specified");
    }

    if (orderItem.info && isNullOrUndefined(orderItem.info.to)) {
      throw new BlError("orderItem.info.to not specified");
    }

    if (
      orderItem.info &&
      isNullOrUndefined(orderItem.info["amountLeftToPay"])
    ) {
      throw new BlError("orderItem.info.amountLeftToPay not specified");
    }
  }
}
