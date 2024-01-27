import {
  BlapiResponse,
  BlError,
  CustomerItem,
  Match,
  MatchVariant,
  Order,
  OrderItem,
  OrderItemType,
  StandMatch,
  UserDetail,
  UserMatch,
  UserPermission,
} from "@boklisten/bl-model";
import { NextFunction, Request, Response } from "express";

import { SystemUser } from "../../../../auth/permission/permission.service";
import { Operation } from "../../../../operation/operation";
import { SEDbQueryBuilder } from "../../../../query/se.db-query-builder";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../bl-collection";
import { customerItemSchema } from "../../../customer-item/customer-item.schema";
import { OrderToCustomerItemGenerator } from "../../../customer-item/helpers/order-to-customer-item-generator";
import { matchSchema } from "../../../match/match.schema";
import { userDetailSchema } from "../../../user-detail/user-detail.schema";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";
import { OrderValidator } from "../../helpers/order-validator/order-validator";
import { orderSchema } from "../../order.schema";

export class OrderPlaceOperation implements Operation {
  private _queryBuilder: SEDbQueryBuilder;

  constructor(
    private _resHandler?: SEResponseHandler,
    private _orderToCustomerItemGenerator?: OrderToCustomerItemGenerator,
    private _orderStorage?: BlDocumentStorage<Order>,
    private _customerItemStorage?: BlDocumentStorage<CustomerItem>,
    private _orderPlacedHandler?: OrderPlacedHandler,
    private _orderValidator?: OrderValidator,
    private _userDetailStorage?: BlDocumentStorage<UserDetail>,
    private _matchStorage?: BlDocumentStorage<Match>,
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
          customerItemSchema,
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

    this._matchStorage ??= new BlDocumentStorage(
      BlCollectionName.Matches,
      matchSchema,
    );

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
      ],
    );

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const existingOrders = await this._orderStorage.getByQuery(dbQuery);
      const alreadyOrderedItems =
        this.filterOrdersByAlreadyOrdered(existingOrders);

      for (const orderItem of order.orderItems) {
        for (const alreadyOrderedItem of alreadyOrderedItems) {
          if (
            String(orderItem.item) === String(alreadyOrderedItem.item) && // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
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
        handoutOrderTypes.has(orderItem.type) && orderItem.blid != null,
    );
    if (handoutItems.length === 0) {
      return false;
    }

    try {
      // Use an aggregation because the query builder does not support checking against a list of blids,
      // and we would otherwise have to send a query for every single order item.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
        "Could not check whether some items are already handed out",
      );
      return false;
    }
  }

  /**
   * For each customerItem, check that the customer who owns it does not have a locked UserMatch with the same item
   * @param customerItems the customer items to be verified
   * @param userMatches the user matches to check against
   * @throws if someone tries to return/buyback a customerItem that's locked to a UserMatch
   * @private
   */
  private verifyCustomerItemsNotInLockedUserMatch(
    customerItems: CustomerItem[],
    userMatches: UserMatch[],
  ) {
    for (const customerItem of customerItems) {
      const customerId = String(customerItem.customer);
      if (
        userMatches.some(
          (userMatch) =>
            userMatch.itemsLockedToMatch &&
            // We need String(obj) because typeof sender/receiver === object
            (String(userMatch.sender) === customerId ||
              String(userMatch.receiver) === customerId) &&
            userMatch.expectedItems.includes(String(customerItem.item)),
        )
      ) {
        throw new BlError(
          "Ordren inneholder bøker som er låst til en UserMatch; kunden må overlevere de låste bøkene til en annen elev",
        ).code(802);
      }
    }
  }

  /**
   * For each item, check that the customer does not have a locked UserMatch with the same item
   * @param itemIds the IDs of the items to be verified
   * @param userMatches the user matches to check against
   * @param customerId the ID of the customer
   * @throws if someone tries to receive an item that's locked to a UserMatch
   * @private
   */
  private verifyItemsNotInLockedUserMatch(
    itemIds: string[],
    userMatches: UserMatch[],
    customerId: string,
  ) {
    for (const itemId of itemIds) {
      if (
        userMatches.some(
          (userMatch) =>
            userMatch.itemsLockedToMatch &&
            // We need String(obj) because typeof sender/receiver === object
            (String(userMatch.sender) === customerId ||
              String(userMatch.receiver) === customerId) &&
            userMatch.expectedItems.includes(itemId),
        )
      ) {
        throw new BlError(
          "Ordren inneholder bøker som er låst til en UserMatch; kunden må motta de låste bøkene fra en annen elev",
        ).code(807);
      }
    }
  }

  /**
   * Go through the orderItems and update matches if any of the customerItems belong to a match
   * @param allMatches all the matches
   * @param returnOrderItems the orderItems for items that are handed in
   * @param handoutOrderItems the orderItems for items that are handed out
   * @private
   */
  private async updateMatchesIfPresent(
    allMatches: Match[],
    returnOrderItems: OrderItem[],
    handoutOrderItems: OrderItem[],
  ) {
    if (returnOrderItems.length === 0 && handoutOrderItems.length === 0) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const returnCustomerItems = await this._customerItemStorage.getMany(
      returnOrderItems.map((orderItem) => String(orderItem.customerItem)),
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const handoutCustomerItems = await this._customerItemStorage.getMany(
      handoutOrderItems.map((orderItem) => String(orderItem.customerItem)),
    );

    const standMatches: StandMatch[] = allMatches.filter(
      (match) => match._variant === MatchVariant.StandMatch,
    ) as StandMatch[];

    // Register items as delivered
    for (const customerItem of returnCustomerItems) {
      const foundStandMatch = standMatches.find(
        (standMatch) =>
          standMatch.expectedHandoffItems.includes(String(customerItem.item)) &&
          !standMatch.deliveredItems.includes(String(customerItem.item)),
      );
      if (foundStandMatch) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await this._matchStorage.update(
          foundStandMatch.id,
          {
            deliveredItems: [
              ...foundStandMatch.deliveredItems,
              customerItem.item as string,
            ],
          },
          new SystemUser(),
        );
      }
    }

    // Register items as received
    for (const customerItem of handoutCustomerItems) {
      const foundStandMatch = standMatches.find(
        (standMatch) =>
          standMatch.expectedPickupItems.includes(String(customerItem.item)) &&
          !standMatch.receivedItems.includes(String(customerItem.item)),
      );
      if (foundStandMatch) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await this._matchStorage.update(
          foundStandMatch.id,
          {
            receivedItems: [
              ...foundStandMatch.receivedItems,
              customerItem.item as string,
            ],
          },
          new SystemUser(),
        );
      }
    }
  }

  public async run(
    blApiRequest: BlApiRequest,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction,
  ): Promise<boolean> {
    let order: Order;

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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

    const someBlidAlreadyHandedOut =
      await this.isSomeBlidAlreadyHandedOut(order);

    if (someBlidAlreadyHandedOut) {
      throw new BlError(
        "En eller flere av bøkene du prøver å dele ut er allerede aktiv på en annen kunde. Prøv å dele ut én og én bok for å finne ut hvilke bøker dette gjelder.",
      ).code(801);
    }

    const returnOrderItems = order.orderItems.filter(
      (orderItem) =>
        orderItem.type === "return" || orderItem.type === "buyback",
    );
    const handoutOrderItems = order.orderItems.filter(
      (orderItem) => orderItem.type === "rent",
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const allMatches = await this._matchStorage.getAll();

    if (!order.byCustomer) {
      await this.verifyCompatibilityWithMatches(
        returnOrderItems,
        handoutOrderItems,
        allMatches,
        String(order.customer),
      );
    }

    let customerItems =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await this._orderToCustomerItemGenerator.generate(order);

    if (customerItems && customerItems.length > 0) {
      customerItems = await this.addCustomerItems(
        customerItems,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        blApiRequest.user,
      );
      order = this.addCustomerItemIdToOrderItems(order, customerItems);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await this._orderStorage.update(
        order.id,
        { orderItems: order.orderItems },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        blApiRequest.user,
      );
    }

    if (!order.byCustomer) {
      await this.updateMatchesIfPresent(
        allMatches,
        returnOrderItems,
        handoutOrderItems,
      );
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await this._orderPlacedHandler.placeOrder(order, {
      sub: blApiRequest.user,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      permission: blApiRequest.user.permission,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } as any);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await this._orderValidator.validate(order);

    if (customerItems && customerItems.length > 0) {
      try {
        // should add customerItems to customer if present
        await this.addCustomerItemsToCustomer(
          customerItems,
          order.customer as string,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          blApiRequest.user,
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}
    } // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._resHandler.sendResponse(res, new BlapiResponse([order]));
    return true;
  }

  /**
   * Verify that the order does not try to hand out or in an item locked to one of the customer's UserMatches
   * @param returnOrderItems the orderItems that will be handed in
   * @param handoutOrderItems the orderItems that will be handed out
   * @param allMatches all the matches
   * @param customerId the customer the order belongs to
   * @throws if the order tries to hand out or in a (customer)Item locked to a UserMatch
   * @private
   */
  private async verifyCompatibilityWithMatches(
    returnOrderItems: OrderItem[],
    handoutOrderItems: OrderItem[],
    allMatches: Match[],
    customerId: string,
  ) {
    const userMatches: UserMatch[] = allMatches.filter(
      (match) => match._variant === MatchVariant.UserMatch,
    ) as UserMatch[];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const returnCustomerItems = await this._customerItemStorage.getMany(
      returnOrderItems.map((orderItem) => String(orderItem.customerItem)),
    );
    const handoutItems = handoutOrderItems.map((orderItem) =>
      String(orderItem.item),
    );
    this.verifyCustomerItemsNotInLockedUserMatch(
      returnCustomerItems,
      userMatches,
    );
    this.verifyItemsNotInLockedUserMatch(handoutItems, userMatches, customerId);
  }

  private async addCustomerItems(
    customerItems: CustomerItem[],
    user: { id: string; permission: UserPermission },
  ): Promise<CustomerItem[]> {
    const addedCustomerItems = [];
    for (const customerItem of customerItems) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const ci = await this._customerItemStorage.add(customerItem, user);
      addedCustomerItems.push(ci);
    }

    return addedCustomerItems;
  }

  private async addCustomerItemsToCustomer(
    customerItems: CustomerItem[],
    customerId: string,
    user: { id: string; permission: UserPermission },
  ): Promise<boolean> {
    const customerItemIds: string[] = customerItems.map((ci) => {
      return ci.id.toString();
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const userDetail = await this._userDetailStorage.get(customerId);

    let userDetailCustomerItemsIds = userDetail.customerItems
      ? (userDetail.customerItems as string[])
      : [];

    userDetailCustomerItemsIds =
      userDetailCustomerItemsIds.concat(customerItemIds);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await this._userDetailStorage.update(
      customerId,
      { customerItems: userDetailCustomerItemsIds },
      user,
    );

    return true;
  }

  private addCustomerItemIdToOrderItems(
    order: Order,
    customerItems: CustomerItem[],
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
