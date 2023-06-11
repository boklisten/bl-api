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
  OrderItemType,
} from "@boklisten/bl-model";
import { OrderToCustomerItemGenerator } from "../../../customer-item/helpers/order-to-customer-item-generator";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { orderSchema } from "../../order.schema";
import { customerItemSchema } from "../../../customer-item/customer-item.schema";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";
import { OrderValidator } from "../../helpers/order-validator/order-validator";
import { userDetailSchema } from "../../../user-detail/user-detail.schema";
import { SEDbQueryBuilder } from "../../../../query/se.db-query-builder";
import { BlCollectionName } from "../../../bl-collection";

export class OrderPlaceOperation implements Operation {
  private _queryBuilder: SEDbQueryBuilder;

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
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);

    this._customerItemStorage = this._customerItemStorage
      ? this._customerItemStorage
      : new BlDocumentStorage(
          BlCollectionName.CustomerItems,
          customerItemSchema
        );

    this._orderPlacedHandler = this._orderPlacedHandler
      ? this._orderPlacedHandler
      : new OrderPlacedHandler();

    this._orderValidator = this._orderValidator
      ? this._orderValidator
      : new OrderValidator();

    this._userDetailStorage = this._userDetailStorage
      ? this._userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);

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

  /**
   * Check whether a blid in the order is already handed out
   *
   * Unable to check against legacy customeritems which have no blid, but there
   * are very few of those which are not returned. Only checks whether a blid is
   * already handed out if the handout order type of the item in this order is
   * "buy", "rent" or "partly-payment".
   *
   * @param order The Order which contains items
   * @private
   */
  private async isSomeBlidAlreadyHandedOut(order: Order): Promise<boolean> {
    const handoutOrderTypes = new Set<OrderItemType>([
      "buy",
      "rent",
      "partly-payment",
    ]);
    const handoutItems = order.orderItems.filter(
      (orderItem) =>
        handoutOrderTypes.has(orderItem.type) && orderItem.blid != null
    );
    if (handoutItems.length === 0) {
      return false;
    }

    try {
      // Use an aggregation because the query builder does not support checking against a list of blids,
      // and we would otherwise have to send a query for every single order item.
      const unreturnedItems = await this._customerItemStorage.aggregate([
        {
          $match: {
            blid: {
              $in: handoutItems.map((handoutItem) => handoutItem.blid),
            },
            returned: false,
            // In some cases, books that have previously been bought out get returned
            // to Boklistens possesion without being registered as a buyback
            // Therefore, it should be possible to hand out books that have been bought out
            buyout: false,
          },
        },
      ]);
      return unreturnedItems.length > 0;
    } catch {
      console.error(
        "Could not check whether some items are already handed out"
      );
      return false;
    }
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
    if (order.byCustomer) {
      const orderContainsActiveCustomerItems =
        await this.hasOpenOrderWithOrderItems(order);
      if (orderContainsActiveCustomerItems) {
        throw new BlError("Order contains active customer items").code(500);
      }
    }

    const someBlidAlreadyHandedOut = await this.isSomeBlidAlreadyHandedOut(
      order
    );

    if (someBlidAlreadyHandedOut) {
      throw new BlError("Some blid is already handed out to a customer").code(
        801
      );
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
