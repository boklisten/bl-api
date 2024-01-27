import { Order, OrderItem, BlError } from "@boklisten/bl-model";

import { SEDbQueryBuilder } from "../../../../query/se.db-query-builder";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../bl-collection";
import { orderSchema } from "../../order.schema";

export class OrderActive {
  private _queryBuilder: SEDbQueryBuilder;

  constructor(private _orderStorage?: BlDocumentStorage<Order>) {
    this._orderStorage = this._orderStorage
      ? this._orderStorage
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this._queryBuilder = new SEDbQueryBuilder();
  }

  public async getActiveOrders(userId: string): Promise<Order[]> {
    const dbQuery = this._queryBuilder.getDbQuery({ customer: userId }, [
      { fieldName: "customer", type: "object-id" },
    ]);

    let orders: Order[];

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      orders = await this._orderStorage.getByQuery(dbQuery);
    } catch (e) {
      if (e instanceof BlError) {
        if (e.getCode() === 702) {
          return [];
        }
      }
      throw e;
    }

    return orders.filter((order) => this.isOrderActive(order));
  }

  public async haveActiveOrders(userId: string): Promise<boolean> {
    const activeOrders = await this.getActiveOrders(userId);
    return activeOrders.length > 0;
  }

  private isOrderActive(order: Order): boolean {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return (
      order.placed &&
      order.orderItems.some((orderItem) => this.isOrderItemActive(orderItem))
    );
  }

  public isOrderItemActive(orderItem: OrderItem): boolean {
    return !(
      orderItem.handout ||
      orderItem.delivered ||
      orderItem.movedToOrder
    );
  }
}
