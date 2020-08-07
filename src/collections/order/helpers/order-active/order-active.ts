import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { Order, OrderItem, BlError } from "@wizardcoder/bl-model";
import { SEDbQueryBuilder } from "../../../../query/se.db-query-builder";
import { orderSchema } from "../../order.schema";

export class OrderActive {
  private _queryBuilder: SEDbQueryBuilder;

  constructor(private _orderStorage?: BlDocumentStorage<Order>) {
    this._orderStorage = this._orderStorage
      ? this._orderStorage
      : new BlDocumentStorage("orders", orderSchema);
    this._queryBuilder = new SEDbQueryBuilder();
  }

  public async haveActiveOrders(userId: string): Promise<boolean> {
    const dbQuery = this._queryBuilder.getDbQuery({ customer: userId }, [
      { fieldName: "customer", type: "object-id" }
    ]);

    let orders: Order[];

    try {
      orders = await this._orderStorage.getByQuery(dbQuery);
    } catch (e) {
      if (e instanceof BlError) {
        if (e.getCode() === 702) {
          return false;
        }
      }
      throw e;
    }

    for (let order of orders) {
      if (this.isOrderActive(order)) {
        return true;
      }
    }

    return false;
  }

  private isOrderActive(order: Order): boolean {
    if (!order.placed) {
      return false;
    }

    for (let orderItem of order.orderItems) {
      if (this.isOrderItemActive(orderItem)) {
        return true;
      }
    }

    return false;
  }

  private isOrderItemActive(orderItem: OrderItem): boolean {
    if (orderItem.handout || orderItem.delivered) {
      return false;
    }
    return true;
  }
}
