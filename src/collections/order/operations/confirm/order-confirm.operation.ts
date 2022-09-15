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
      : new BlDocumentStorage("orders", orderSchema);

    this._orderPlacedHandler = this._orderPlacedHandler
      ? this._orderPlacedHandler
      : new OrderPlacedHandler();

    this._queryBuilder = new SEDbQueryBuilder();
  }

  private async hasDuplicateOrder(order: Order) {
    const dbQuery = this._queryBuilder.getDbQuery(
      { customer: order.customer, placed: "true" },
      [
        { fieldName: "customer", type: "object-id" },
        { fieldName: "placed", type: "boolean" },
      ]
    );

    try {
      const existingOrders = await this._orderStorage.getByQuery(dbQuery);
      return existingOrders
        .filter(
          (existingOrder) => existingOrder.orderItems.length === order.orderItems.length
        )
        .some((existingOrder) =>
          order.orderItems.every((orderItem) =>
            existingOrder.orderItems.some(
              (existingOrderItem) =>
                String(orderItem.item) === String(existingOrderItem.item) &&
                orderItem.type === existingOrderItem.type &&
                orderItem.info.to === existingOrderItem.info.to
            )
          )
        );
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

    const isDuplicateOrder = await this.hasDuplicateOrder(order);

    if (isDuplicateOrder) {
      throw new BlError("There already exists an order with these orderitems");
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
