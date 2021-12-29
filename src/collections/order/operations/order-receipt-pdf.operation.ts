import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { Messenger } from "../../../messenger/messenger";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlapiResponse, Order, UserDetail } from "@boklisten/bl-model";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { orderSchema } from "../order.schema";
import { SEResponseHandler } from "../../../response/se.response.handler";

export class OrderReceiptPdfOperation implements Operation {
  private _messenger: Messenger;
  private _userDetailStorage: BlDocumentStorage<UserDetail>;
  private _orderStorage: BlDocumentStorage<Order>;
  private _resHandler?: SEResponseHandler;

  constructor(
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    resHandler?: SEResponseHandler,
    orderStorage?: BlDocumentStorage<Order>
  ) {
    this._messenger = new Messenger();
    this._userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
    this._orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage("orders", orderSchema);
    this._resHandler = resHandler ? resHandler : new SEResponseHandler();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction
  ): Promise<boolean> {
    const order = await this._orderStorage.get(blApiRequest.documentId);
    const customerDetail = await this._userDetailStorage.get(
      order.customer as string
    );

    const orderReceiptPdf = await this._messenger.getOrderReceiptPdf(
      customerDetail,
      order
    );

    this._resHandler.sendResponse(res, new BlapiResponse([orderReceiptPdf]));

    return true;
  }
}
