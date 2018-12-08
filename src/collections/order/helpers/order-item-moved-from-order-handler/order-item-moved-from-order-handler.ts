import {BlError, Order} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {SystemUser} from '../../../../auth/permission/permission.service';
import {orderSchema} from '../../order.schema';

type OrderItemToUpdate = {
  itemId: string;
  originalOrderId: string;
  newOrderId: string;
};

export class OrderItemMovedFromOrderHandler {
  private _orderStorage: BlDocumentStorage<Order>;

  constructor(orderStorage?: BlDocumentStorage<Order>) {
    this._orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage('orders', orderSchema);
  }

  public async updateOrderItems(order: Order): Promise<boolean> {
    const orderItemsToUpdate: OrderItemToUpdate[] = [];

    for (let orderItem of order.orderItems) {
      if (orderItem.movedFromOrder) {
        orderItemsToUpdate.push({
          itemId: orderItem.item as string,
          originalOrderId: orderItem.movedFromOrder as string,
          newOrderId: order.id,
        });
      }
    }

    try {
      await this.addMovedToOrderOnOrderItems(orderItemsToUpdate);
      return true;
    } catch (e) {
      throw e;
    }
  }

  private async addMovedToOrderOnOrderItems(
    orderItemsToUpdate: OrderItemToUpdate[],
  ): Promise<boolean> {
    try {
      for (let orderItemToUpdate of orderItemsToUpdate) {
        await this.updateOrderItem(orderItemToUpdate);
      }

      return true;
    } catch (e) {
      throw e;
    }
  }

  private async updateOrderItem(
    orderItemToUpdate: OrderItemToUpdate,
  ): Promise<boolean> {
    let originalOrder: Order;

    originalOrder = await this._orderStorage.get(
      orderItemToUpdate.originalOrderId,
    );

    for (let orderItem of originalOrder.orderItems) {
      if (orderItem.item.toString() === orderItemToUpdate.itemId.toString()) {
        if (orderItem.movedToOrder) {
          throw new BlError(`orderItem has "movedToOrder" already set`);
        }
        orderItem.movedToOrder = orderItemToUpdate.newOrderId;
      }
    }

    await this._orderStorage.update(
      orderItemToUpdate.originalOrderId,
      {orderItems: originalOrder.orderItems},
      new SystemUser(),
    );
    return true;
  }
}
