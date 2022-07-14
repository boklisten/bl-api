/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-catch */
import { NextFunction, Request, Response } from "express";
import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import {
  BlapiResponse,
  Order,
  CustomerItem,
  UserDetail,
  BlError,
} from "@boklisten/bl-model";
import { OrderToCustomerItemGenerator } from "../../../customer-item/helpers/order-to-customer-item-generator";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { orderSchema } from "../../order.schema";
import { customerItemSchema } from "../../../customer-item/customer-item.schema";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";
import { OrderValidator } from "../../helpers/order-validator/order-validator";
import { userDetailSchema } from "../../../user-detail/user-detail.schema";

export class OrderPlaceOperation implements Operation {
  constructor(
    private _resHandler?: SEResponseHandler,
    private _orderToCustomerItemGenerator?: OrderToCustomerItemGenerator,
    private _orderStorage?: BlDocumentStorage<Order>,
    private _customerItemStorage?: BlDocumentStorage<CustomerItem>,
    private _orderPlacedHandler?: OrderPlacedHandler,
    private _orderValidator?: OrderValidator,
    private _userDetailStorage?: BlDocumentStorage<UserDetail>
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

    this._userDetailStorage = this._userDetailStorage
      ? this._userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
  }

  private async orderContainsActiveCustomerItems(order: Order) {
    for (const orderItem of order.orderItems) {
      if (orderItem.type !== "rent" && orderItem.type !== "partly-payment") {
        continue;
      }

      const customerItemsWithBlid = await this._customerItemStorage.aggregate([
        {
          $match: {
            blid: orderItem.blid,
            cancel: false,
            buyout: false,
            buyback: false,
            returned: false,
          },
        },
      ]);
      if (customerItemsWithBlid.length > 0) {
        return true;
      }
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
    let order: Order;

    try {
      order = await this._orderStorage.get(blApiRequest.documentId);
    } catch (e) {
      throw new ReferenceError(`order "${blApiRequest.documentId}" not found`);
    }
    const orderContainsActiveCustomerItems =
      await this.orderContainsActiveCustomerItems(order);
    if (orderContainsActiveCustomerItems) {
      throw new BlError("Order contains active customer items").code(500);
    }

    let customerItems: CustomerItem[] = [];

    try {
      customerItems = await this._orderToCustomerItemGenerator.generate(order);
    } catch (e) {
      throw e;
    }

    if (customerItems && customerItems.length > 0) {
      try {
        customerItems = await this.addCustomerItems(
          customerItems,
          blApiRequest.user
        );
        order = this.addCustomerItemIdToOrderItems(order, customerItems);

        await this._orderStorage.update(
          order.id,
          { orderItems: order.orderItems },
          blApiRequest.user
        );
      } catch (e) {
        throw e;
      }
    }

    try {
      await this._orderPlacedHandler.placeOrder(order, {
        sub: blApiRequest.user,
        permission: blApiRequest.user.permission,
      } as any);
    } catch (e) {
      throw e;
    }

    try {
      await this._orderValidator.validate(order);
    } catch (e) {
      throw e;
    }

    if (customerItems && customerItems.length > 0) {
      try {
        // should add customerItems to customer if present
        await this.addCustomerItemsToCustomer(
          customerItems,
          order.customer as string,
          blApiRequest.user
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    this._resHandler.sendResponse(res, new BlapiResponse([order]));
    return true;
  }

  private async addCustomerItems(
    customerItems: CustomerItem[],
    user: any
  ): Promise<CustomerItem[]> {
    const addedCustomerItems = [];
    for (const customerItem of customerItems) {
      try {
        const ci = await this._customerItemStorage.add(customerItem, user);
        addedCustomerItems.push(ci);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    return addedCustomerItems;
  }

  private async addCustomerItemsToCustomer(
    customerItems: CustomerItem[],
    customerId: string,
    user: { id: string; permission: any }
  ): Promise<boolean> {
    const customerItemIds: string[] = customerItems.map((ci) => {
      return ci.id.toString();
    });

    let userDetail: UserDetail;

    try {
      userDetail = await this._userDetailStorage.get(customerId);
    } catch (e) {
      throw e;
    }

    let userDetailCustomerItemsIds = userDetail.customerItems
      ? (userDetail.customerItems as string[])
      : [];

    userDetailCustomerItemsIds =
      userDetailCustomerItemsIds.concat(customerItemIds);

    try {
      await this._userDetailStorage.update(
        customerId,
        { customerItems: userDetailCustomerItemsIds },
        user as any
      );
    } catch (e) {
      throw e;
    }

    return true;
  }

  private addCustomerItemIdToOrderItems(
    order: Order,
    customerItems: CustomerItem[]
  ) {
    for (const customerItem of customerItems) {
      for (const orderItem of order.orderItems) {
        if (customerItem.item === orderItem.item) {
          orderItem.customerItem = customerItem.id;
        }
      }
    }
    return order;
  }
}
