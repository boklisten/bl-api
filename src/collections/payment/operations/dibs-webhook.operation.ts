import { Operation } from "../../../operation/operation";
import { Order, Payment, BlApiRequest } from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { paymentSchema } from "../payment.schema";
import { orderSchema } from "../../order/order.schema";
import { Request, Response, NextFunction } from "express";
import { BlApiRequest } from "../../../request/bl-api-request";

export class DibsWebhookOperation implements Operation {
  private _orderStorage: BlDocumentStorage<Order>;
  private _paymentStorage: BlDocumentStorage<Payment>;

  constructor(orderStorage?: BlDocumentStorage<Order>, paymentStorage?: BlDocumentStorage<Payment>) {
    this._paymentStorage = (paymentStorage) ? paymentStorage :  new BlDocumentStorage<Payment>('payments', paymentSchema);
    this._orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage<Order>('orders', orderSchema);
  }

  public run(blApiRequest: BlApiRequest, req?: Request, res?: Response, next?: NextFunction): Promise<boolean> {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  private handleEvent(eventObj) {
    switch(eventObj.event) {
      case "payment.created": 
        break;
      case "payment.reservation.created":
        break;
      case "payment.charge.created":
        break;
      case "payment.charge.failed":
        break;
      case "payment.cancel.created":
        break;
      case "payment.cancel.failed":
        break;
      case "payment.refund.initiated":
        break;
      case "payment.refund.completed":
        break;
      case "payment.refund.failed":
        break;
    }
  }
}
