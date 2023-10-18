import { BlError, Order } from "@boklisten/bl-model";

import { SystemUser } from "../../../../auth/permission/permission.service";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../bl-collection";
import { orderSchema } from "../../order.schema";

type OrderItemToUpdate = {
  itemId: string;
  originalOrderId: string;
  newOrderId: string;
};

export class OrderItemMovedFromOrderHandler {
  constructor(private _orderStorage?: BlDocumentStorage<Order>) {
    this._orderStorage ??= new BlDocumentStorage(
      BlCollectionName.Orders,
      orderSchema,
    );
  }

  public async updateOrderItems(order: Order): Promise<boolean> {
    const orderItemsToUpdate: OrderItemToUpdate[] = order.orderItems
      .filter((orderItem) => orderItem.movedFromOrder)
      .map((orderItem) => ({
        itemId: String(orderItem.item),
        originalOrderId: String(orderItem.movedFromOrder),
        newOrderId: order.id,
      }));

    return await this.addMovedToOrderOnOrderItems(orderItemsToUpdate);
  }

  private async addMovedToOrderOnOrderItems(
    orderItemsToUpdate: OrderItemToUpdate[],
  ): Promise<boolean> {
    for (const orderItemToUpdate of orderItemsToUpdate) {
      await this.updateOrderItem(orderItemToUpdate);
    }
    return true;
  }

  private async updateOrderItem(
    orderItemToUpdate: OrderItemToUpdate,
  ): Promise<boolean> {
    const originalOrder = await this._orderStorage.get(
      orderItemToUpdate.originalOrderId,
    );

    for (const orderItem of originalOrder.orderItems) {
      if (String(orderItem.item) === String(orderItemToUpdate.itemId)) {
        if (!orderItem.movedToOrder) {
          orderItem.movedToOrder = orderItemToUpdate.newOrderId;
        } else if (
          String(orderItem.movedToOrder) !== orderItemToUpdate.newOrderId
        ) {
          throw new BlError(`orderItem has "movedToOrder" already set`);
        }
      }
    }

    await this._orderStorage.update(
      orderItemToUpdate.originalOrderId,
      { orderItems: originalOrder.orderItems },
      new SystemUser(),
    );
    return true;
  }
}
