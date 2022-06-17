import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { Order, OrderItem, BlError } from "@boklisten/bl-model";
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
      { fieldName: "customer", type: "object-id" },
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

    return orders.some((order) => this.isOrderActive(order));
  }

  private isOrderActive(order: Order): boolean {
    return (
      order.placed &&
      order.orderItems.some((orderItem) => this.isOrderItemActive(orderItem))
    );
  }

  private isOrderItemActive(orderItem: OrderItem): boolean {
    return !(orderItem.handout || orderItem.delivered);
  }
}
