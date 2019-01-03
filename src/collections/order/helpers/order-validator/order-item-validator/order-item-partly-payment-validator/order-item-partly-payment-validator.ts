import { OrderItem, Item, Branch, BlError } from "@wizardcoder/bl-model";

export class OrderItemPartlyPaymentValidator {

  constructor() {
  }

  public validate(orderItem: OrderItem, Item: Item, branch: Branch): Promise<boolean> {

    if (orderItem.type !== "partly-payment") {
      return Promise.reject(new BlError("orderItem not of type 'partly-payment'"));
    }

    try {
      this.validateFields(orderItem);
    } catch (e) {
      return Promise.reject(e);
    }

    if (!this.isPeriodSupported(orderItem.info.periodType, branch)) {
      return Promise.reject(new BlError(`partly-payment period "${orderItem.info.periodType}" not supported on branch`));
    }

    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  private isPeriodSupported(period: any, branch: Branch) {
    if (branch.paymentInfo && branch.paymentInfo.partlyPaymentPeriods) {
      for (let partlyPaymentPeriod of branch.paymentInfo.partlyPaymentPeriods) {
        if (partlyPaymentPeriod.type === period) {
          return true;
        }
      }
    }

    return false;
  }

  private validateFields(orderItem: OrderItem) {
    if (!orderItem.info) {
      throw new BlError("orderItem.info not specified");
    }

    if (orderItem.info && !orderItem.info.to) {
      throw new BlError("orderItem.info.to not specified");
    }

    if (orderItem.info && !orderItem.info['amountLeftToPay']) {
      throw new BlError("orderItem.info.amountLeftToPay not specified");
    }
  }

}
