import { NextFunction, Request, Response } from "express";
import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { BlapiResponse, Order, CustomerItem } from "@wizardcoder/bl-model";
import { OrderToCustomerItemGenerator } from "../../../customer-item/helpers/order-to-customer-item-generator";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { orderSchema } from "../../order.schema";
import { customerItemSchema } from "../../../customer-item/customer-item.schema";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";
import { OrderValidator } from "../../helpers/order-validator/order-validator";

export class OrderPlaceOperation implements Operation {
  constructor(
    private _resHandler?: SEResponseHandler,
    private _orderToCustomerItemGenerator?: OrderToCustomerItemGenerator,
    private _orderStorage?: BlDocumentStorage<Order>,
    private _customerItemStorage?: BlDocumentStorage<CustomerItem>,
    private _orderPlacedHandler?: OrderPlacedHandler,
    private _orderValidator?: OrderValidator
  ) {
    this._resHandler = this._resHandler
      ? this._resHandler
      : new SEResponseHandler();

    this._orderToCustomerItemGenerator = this._orderToCustomerItemGenerator
      ? this._orderToCustomerItemGenerator
      : new OrderToCustomerItemGenerator();

    this._orderStorage = this._orderStorage
      ? this._orderStorage
      : new BlDocumentStorage("orders", orderSchema);

    this._customerItemStorage = this._customerItemStorage
      ? this._customerItemStorage
      : new BlDocumentStorage("customeritems", customerItemSchema);

    this._orderPlacedHandler = this._orderPlacedHandler
      ? this._orderPlacedHandler
      : new OrderPlacedHandler();
    this._orderValidator = this._orderValidator
      ? this._orderValidator
      : new OrderValidator();
  }

  public async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction
  ): Promise<boolean> {
    let order: Order;

    try {
      order = await this._orderStorage.get(blApiRequest.documentId);
    } catch (e) {
      console.log(e);
      throw new ReferenceError(`order "${blApiRequest.documentId}" not found`);
    }

    let customerItems: CustomerItem[] = [];

    try {
      customerItems = await this._orderToCustomerItemGenerator.generate(order);
    } catch (e) {
      console.log("customerItem could not be created", e);
      throw e;
    }

    if (customerItems && customerItems.length > 0) {
      try {
        for (let customerItem of customerItems) {
          customerItem = await this._customerItemStorage.add(
            customerItem,
            blApiRequest.user
          );
        }

        order = this.addCustomerItemIdToOrderItems(order, customerItems);

        await this._orderStorage.update(
          order.id,
          { orderItems: order.orderItems },
          blApiRequest.user
        );
      } catch (e) {
        console.log(e);
        throw e;
      }
    }

    try {
      await this._orderPlacedHandler.placeOrder(order, {
        sub: blApiRequest.user,
        permission: blApiRequest.user.permission
      } as any);
    } catch (e) {
      console.log(e);
      throw e;
    }

    try {
      await this._orderValidator.validate(order);
    } catch (e) {
      console.log(e);
      throw e;
    }

    this._resHandler.sendResponse(res, new BlapiResponse([order]));
    return true;
  }

  private addCustomerItemIdToOrderItems(
    order: Order,
    customerItems: CustomerItem[]
  ) {
    for (let customerItem of customerItems) {
      for (let orderItem of order.orderItems) {
        if (customerItem.item === orderItem.item) {
          orderItem.customerItem = customerItem.id;
        }
      }
    }
    return order;
  }
}
