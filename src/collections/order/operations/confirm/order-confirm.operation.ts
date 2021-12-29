import { NextFunction, Request, Response } from "express";
import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { orderSchema } from "../../order.schema";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import {
  AccessToken,
  BlError,
  BlapiResponse,
  Order,
} from "@boklisten/bl-model";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";

export class OrderConfirmOperation implements Operation {
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
