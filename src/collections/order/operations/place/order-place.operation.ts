import {
  BlapiResponse,
  BlError,
  CustomerItem,
  Match,
  MatchVariant,
  Order,
  OrderItem,
  OrderItemType,
  UserDetail,
  UserMatch,
  UserPermission,
} from "@boklisten/bl-model";
import { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { PipelineStage } from "mongoose";

import { PermissionService } from "../../../../auth/permission/permission.service";
import { isNotNullish } from "../../../../helper/typescript-helpers";
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
  private _permissionService: PermissionService;
  private readonly _resHandler: SEResponseHandler;
  private readonly _orderToCustomerItemGenerator: OrderToCustomerItemGenerator;
  private readonly _orderStorage: BlDocumentStorage<Order>;
  private readonly _customerItemStorage: BlDocumentStorage<CustomerItem>;
  private readonly _orderPlacedHandler: OrderPlacedHandler;
  private readonly _orderValidator: OrderValidator;
  private readonly _userDetailStorage: BlDocumentStorage<UserDetail>;
  private readonly _matchStorage: BlDocumentStorage<Match>;

  constructor(
    resHandler?: SEResponseHandler,
    orderToCustomerItemGenerator?: OrderToCustomerItemGenerator,
    orderStorage?: BlDocumentStorage<Order>,
    customerItemStorage?: BlDocumentStorage<CustomerItem>,
    orderPlacedHandler?: OrderPlacedHandler,
    orderValidator?: OrderValidator,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    matchStorage?: BlDocumentStorage<Match>,
  ) {
    this._resHandler = resHandler ?? new SEResponseHandler();

    this._orderToCustomerItemGenerator =
      orderToCustomerItemGenerator ?? new OrderToCustomerItemGenerator();

    this._orderStorage =
      orderStorage ??
      new BlDocumentStorage(BlCollectionName.Orders, orderSchema);

    this._customerItemStorage =
      customerItemStorage ??
      new BlDocumentStorage(BlCollectionName.CustomerItems, customerItemSchema);

    this._orderPlacedHandler = orderPlacedHandler ?? new OrderPlacedHandler();

    this._orderValidator = orderValidator ?? new OrderValidator();

    this._userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);

    this._matchStorage =
      matchStorage ??
      new BlDocumentStorage(BlCollectionName.Matches, matchSchema);

    this._queryBuilder = new SEDbQueryBuilder();
    this._permissionService = new PermissionService();
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
   * @param returnOrderItems the orderItems for items that are handed in
   * @param handoutOrderItems the orderItems for items that are handed out
   * @private
   */
  private async updateMatchesIfPresent(
    returnOrderItems: OrderItem[],
    handoutOrderItems: OrderItem[],
  ) {
    if (returnOrderItems.length === 0 && handoutOrderItems.length === 0) {
      return;
    }

    const returnCustomerItems = await this._customerItemStorage.getMany(
      returnOrderItems
        .map((orderItem) => orderItem.customerItem as string | undefined)
        .filter(isNotNullish),
    );

    const handoutCustomerItems = await this._customerItemStorage.getMany(
      handoutOrderItems
        .map((orderItem) => orderItem.customerItem as string | undefined)
        .filter(isNotNullish),
    );

    await Promise.all([
      this.updateStandMatchHandoffs(returnCustomerItems),
      this.updateStandMatchPickups(handoutCustomerItems),
      this.updateSenderUserMatches(returnCustomerItems),
      this.updateReceiverUserMatches(handoutCustomerItems),
    ]);
  }

  // Update the deliveredItems of the customer's StandMatches to show those newly handed in
  private async updateStandMatchHandoffs(returnCustomerItems: CustomerItem[]) {
    return await Promise.all(
      returnCustomerItems.map(async (returnCustomerItem) => {
        await this._matchStorage.aggregate(
          this.buildUpdateStandMatchAggregation("handoff", returnCustomerItem),
        );
      }),
    );
  }

  // Update the receivedItems of the customer's StandMatches to show those newly picked up
  private async updateStandMatchPickups(handoutCustomerItems: CustomerItem[]) {
    return await Promise.all(
      handoutCustomerItems.map(async (handoutCustomerItem) => {
        await this._matchStorage.aggregate(
          this.buildUpdateStandMatchAggregation("pickup", handoutCustomerItem),
        );
      }),
    );
  }

  // Update the receivedBlids of all UserMatches where the stand customer is receiver to show those newly picked up
  private async updateReceiverUserMatches(
    handoutCustomerItems: CustomerItem[],
  ) {
    return await Promise.all(
      handoutCustomerItems
        .filter((customerItem) => customerItem.blid)
        .map(async (handoutCustomerItem) => {
          await this._matchStorage.aggregate(
            this.buildUpdateUserMatchAggregation(
              "receive",
              handoutCustomerItem,
            ),
          );
        }),
    );
  }

  // Update the deliveredBlIds of all UserMatches where the book owner is sender to show those newly handed in
  private async updateSenderUserMatches(returnCustomerItems: CustomerItem[]) {
    return await Promise.all(
      returnCustomerItems
        .filter((customerItem) => customerItem.blid)
        .map(async (returnCustomerItem) => {
          await this._matchStorage.aggregate(
            this.buildUpdateUserMatchAggregation("deliver", returnCustomerItem),
          );
        }),
    );
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

    const pendingSignature =
      await this._orderPlacedHandler.isSignaturePending(order);

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
      (orderItem) => orderItem.handout && orderItem.type === "rent",
    );

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
      await this._orderToCustomerItemGenerator.generate(order);

    if (customerItems && customerItems.length > 0) {
      customerItems = await this.addCustomerItems(
        customerItems,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        blApiRequest.user,
      );
      order = this.addCustomerItemIdToOrderItems(order, customerItems);

      await this._orderStorage.update(
        order.id,
        {
          orderItems: order.orderItems,
          pendingSignature,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        blApiRequest.user,
      );
    }

    if (!order.byCustomer) {
      await this.updateMatchesIfPresent(returnOrderItems, handoutOrderItems);
    }

    await this._orderPlacedHandler.placeOrder(order, {
      sub: blApiRequest.user,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      permission: blApiRequest.user.permission,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } as any);

    const isAdmin =
      blApiRequest.user?.permission !== undefined &&
      this._permissionService.isPermissionEqualOrOver(
        blApiRequest.user?.permission,
        "admin",
      );

    await this._orderValidator.validate(order, isAdmin);

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
    );
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

    const userDetail = await this._userDetailStorage.get(customerId);

    let userDetailCustomerItemsIds = userDetail.customerItems
      ? (userDetail.customerItems as string[])
      : [];

    userDetailCustomerItemsIds =
      userDetailCustomerItemsIds.concat(customerItemIds);

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

  private buildUpdateUserMatchAggregation(
    action: "receive" | "deliver",
    customerItem: CustomerItem,
  ): PipelineStage[] {
    const isReceive = action === "receive";
    const blid = customerItem.blid;
    const customerId = new ObjectId(customerItem.customer as string);
    const itemId = new ObjectId(customerItem.item as string);

    return [
      // Find customer's user matches which receive/deliver the item
      {
        $match: {
          _variant: MatchVariant.UserMatch,
          ...(isReceive ? { receiver: customerId } : { sender: customerId }),
          expectedItems: itemId,
        },
      },
      // Look up the items of the already received/delivered blids
      {
        $lookup: {
          from: BlCollectionName.UniqueItems,
          localField: isReceive ? "receivedBlIds" : "deliveredBlIds",
          foreignField: "blid",
          as: "processedItems",
        },
      },
      // Map the items to only their IDs
      {
        $addFields: {
          processedItems: {
            $map: {
              input: "$processedItems",
              in: "$$this._id",
            },
          },
        },
      },
      // Filter on matches where the item is not already delivered/received
      {
        $match: {
          $nor: [
            {
              processedItems: itemId,
            },
          ],
        },
      },
      // Add the new blid
      {
        $project: {
          ...(isReceive
            ? {
                receivedBlIds: {
                  $concatArrays: ["$receivedBlIds", [blid]],
                },
              }
            : {
                deliveredBlIds: {
                  $concatArrays: ["$deliveredBlIds", [blid]],
                },
              }),
        },
      },
      // Save
      {
        $merge: {
          into: BlCollectionName.Matches,
          whenNotMatched: "discard",
        },
      },
    ];
  }

  private buildUpdateStandMatchAggregation(
    action: "pickup" | "handoff",
    customerItem: CustomerItem,
  ): PipelineStage[] {
    const isPickup = action === "pickup";
    const customerId = new ObjectId(customerItem.customer as string);
    const itemId = new ObjectId(customerItem.item as string);

    return [
      // Find stand matches where the item would be picked up/handed off
      {
        $match: {
          _variant: MatchVariant.StandMatch,
          customer: customerId,
          ...(isPickup
            ? { expectedPickupItems: itemId }
            : { expectedHandoffItems: itemId }),
          $nor: [
            isPickup
              ? {
                  receivedItems: itemId,
                }
              : {
                  deliveredItems: itemId,
                },
          ],
        },
      },
      // Add the item to the match as delivered/received
      {
        $project: {
          ...(isPickup
            ? {
                deliveredItems: {
                  $concatArrays: ["$deliveredItems", [itemId]],
                },
              }
            : {
                receivedItems: {
                  $concatArrays: ["$receivedItems", [itemId]],
                },
              }),
        },
      },
      // Save
      {
        $merge: {
          into: BlCollectionName.Matches,
          whenNotMatched: "discard",
        },
      },
    ];
  }
}
