import { NextFunction, Request, Response } from "express";
import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { orderSchema } from "../../order.schema";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import {
  AccessToken,
  BlapiResponse,
  BlError,
  Order,
} from "@boklisten/bl-model";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";
import { SEDbQueryBuilder } from "../../../../query/se.db-query-builder";
import { BlCollectionName } from "../../../bl-collection";

export class OrderConfirmOperation implements Operation {
  private _queryBuilder: SEDbQueryBuilder;

  constructor(
    private _resHandler?: SEResponseHandler,
    private _orderStorage?: BlDocumentStorage<Order>,
    private _orderPlacedHandler?: OrderPlacedHandler
  ) {
    this._resHandler = this._resHandler
      ? this._resHandler
      : new SEResponseHandler();

    this._orderStorage = this._orderStorage
      ? this._orderStorage
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);

    this._orderPlacedHandler = this._orderPlacedHandler
      ? this._orderPlacedHandler
      : new OrderPlacedHandler();

    this._queryBuilder = new SEDbQueryBuilder();
  }

  private filterOrdersByAlreadyOrdered(orders: Order[]) {
    const customerOrderItems = [];

    for (const order of orders) {
      if (order.orderItems) {
        for (const orderItem of order.orderItems) {
          if (order.handoutByDelivery || !order.byCustomer) {
            continue;
          }

          if (orderItem.handout) {
            continue;
          }

          if (orderItem.movedToOrder) {
            continue;
          }

          if (
            orderItem.type === "rent" ||
            orderItem.type === "buy" ||
            orderItem.type === "partly-payment"
          ) {
            customerOrderItems.push(orderItem);
          }
        }
      }
    }
    return customerOrderItems;
  }

  private async hasOpenOrderWithOrderItems(order: Order) {
    const dbQuery = this._queryBuilder.getDbQuery(
      { customer: order.customer, placed: "true" },
      [
        { fieldName: "customer", type: "object-id" },
        { fieldName: "placed", type: "boolean" },
      ]
    );

    try {
      const existingOrders = await this._orderStorage.getByQuery(dbQuery);
      const alreadyOrderedItems =
        this.filterOrdersByAlreadyOrdered(existingOrders);

      for (const orderItem of order.orderItems) {
        for (const alreadyOrderedItem of alreadyOrderedItems) {
          if (
            String(orderItem.item) === String(alreadyOrderedItem.item) &&
            orderItem.info.to === alreadyOrderedItem.info.to
          ) {
            return true;
          }
        }
      }
    } catch {
      console.log("could not get user orders");
    }

    return false;
  }

  public async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction
  ): Promise<boolean> {
    const accessToken = {
      details: blApiRequest.user.id,
      permission: blApiRequest.user.permission,
    } as AccessToken;

    let order;

    try {
      order = await this._orderStorage.get(blApiRequest.documentId);
    } catch (e) {
      throw new BlError(`order "${blApiRequest.documentId}" not found`);
    }

    const alreadyOrderedSomeItems = await this.hasOpenOrderWithOrderItems(
      order
    );

    if (alreadyOrderedSomeItems) {
      throw new BlError(
        "There already exists an order with some of these orderitems"
      );
    }

    let placedOrder;

    try {
      placedOrder = await this._orderPlacedHandler.placeOrder(
        order,
        accessToken
      );
    } catch (e) {
      throw new BlError("order could not be placed:" + e);
    }

    this._resHandler.sendResponse(res, new BlapiResponse([placedOrder]));

    return true;
  }
}
