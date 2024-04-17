import { Branch, OrderItem, Item, BlError, Order } from "@boklisten/bl-model";

import { OrderItemRentPeriodValidator } from "./order-item-rent-period-validator/order-item-rent-period-validator";
import { isNullish } from "../../../../../../helper/typescript-helpers";
import { BlDocumentStorage } from "../../../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../../../bl-collection";
import { orderSchema } from "../../../../order.schema";

export class OrderItemRentValidator {
  private orderItemRentPeriodValidator: OrderItemRentPeriodValidator;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  constructor(private _orderStorage?: BlDocumentStorage<Order>) {
    this._orderStorage = _orderStorage
      ? _orderStorage
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this.orderItemRentPeriodValidator = new OrderItemRentPeriodValidator();
  }

  public async validate(
    branch: Branch,
    orderItem: OrderItem,
    item: Item,
  ): Promise<boolean> {
    try {
      await this.validateOrderItemInfoFields(orderItem);
      await this.orderItemRentPeriodValidator.validate(
        orderItem,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        branch.paymentInfo,
        item.price,
      );
      return Promise.resolve(true);
    } catch (e) {
      if (e instanceof BlError) {
        return Promise.reject(e);
      }
      return Promise.reject(
        new BlError(
          "unknown error, could not validate orderItem type rent",
        ).store("error", e),
      );
    }
  }

  private validateOrderItemInfoFields(orderItem: OrderItem): boolean {
    if (isNullish(orderItem.info)) {
      throw new BlError(
        'orderItem.info is not set when orderItem.type is "rent"',
      );
    }
    return true;
  }
}
