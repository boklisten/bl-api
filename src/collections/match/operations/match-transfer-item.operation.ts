import {
  BlapiResponse,
  BlError,
  CustomerItem,
  Match,
  MatchVariant,
  Order,
  UniqueItem,
  UserMatch,
} from "@boklisten/bl-model";

import {
  createMatchOrder,
  getAllMatchesForUser,
} from "./match-operation-utils";
import { SystemUser } from "../../../auth/permission/permission.service";
import { Operation } from "../../../operation/operation";
import { SEDbQuery } from "../../../query/se.db-query";
import { BlApiRequest } from "../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { customerItemSchema } from "../../customer-item/customer-item.schema";
import { CustomerItemActiveBlid } from "../../customer-item/helpers/customer-item-active-blid";
import { OrderToCustomerItemGenerator } from "../../customer-item/helpers/order-to-customer-item-generator";
import { OrderItemMovedFromOrderHandler } from "../../order/helpers/order-item-moved-from-order-handler/order-item-moved-from-order-handler";
import { OrderValidator } from "../../order/helpers/order-validator/order-validator";
import { orderSchema } from "../../order/order.schema";
import { uniqueItemSchema } from "../../unique-item/unique-item.schema";
import { matchSchema } from "../match.schema";

export class MatchTransferItemOperation implements Operation {
  private readonly _matchStorage: BlDocumentStorage<Match>;
  private readonly _orderStorage: BlDocumentStorage<Order>;
  private readonly _customerItemStorage: BlDocumentStorage<CustomerItem>;
  private readonly _uniqueItemStorage: BlDocumentStorage<UniqueItem>;

  constructor(
    matchStorage?: BlDocumentStorage<Match>,
    orderStorage?: BlDocumentStorage<Order>,
    customerItemStorage?: BlDocumentStorage<CustomerItem>,
    uniqueItemStorage?: BlDocumentStorage<UniqueItem>,
  ) {
    this._matchStorage =
      matchStorage ??
      new BlDocumentStorage(BlCollectionName.Matches, matchSchema);
    this._orderStorage =
      orderStorage ??
      new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this._customerItemStorage =
      customerItemStorage ??
      new BlDocumentStorage(BlCollectionName.CustomerItems, customerItemSchema);
    this._uniqueItemStorage =
      uniqueItemStorage ??
      new BlDocumentStorage(BlCollectionName.UniqueItems, uniqueItemSchema);
  }

  private isValidBlid(scannedText: string): boolean {
    if (Number.isNaN(Number(scannedText))) {
      if (scannedText.length === 12) {
        return true;
      }
    } else if (scannedText.length === 8) {
      return true;
    }
    return false;
  }

  private async updateMatches(
    customerItem: CustomerItem,
    senderUserMatch: UserMatch | undefined,
    senderMatches: Match[],
  ): Promise<void> {
    if (senderUserMatch !== undefined) {
      await this._matchStorage.update(
        senderUserMatch.id,
        {
          deliveredBlIds: [
            ...senderUserMatch.deliveredBlIds,
            customerItem.blid!,
          ],
        },
        new SystemUser(),
      );
      return;
    }

    const senderStandMatch = senderMatches
      .filter((match) => match._variant === MatchVariant.StandMatch)
      .find(
        (standMatch) =>
          standMatch.expectedHandoffItems.includes(customerItem.item) &&
          !standMatch.deliveredItems.includes(customerItem.blid!),
      );

    if (senderStandMatch === undefined) {
      return;
    }

    await this._matchStorage.update(
      senderStandMatch.id,
      {
        deliveredItems: [...senderStandMatch.deliveredItems, customerItem.item],
      },
      new SystemUser(),
    );
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    let userFeedback;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const blid = blApiRequest?.data?.["blid"];
    if (!blid || typeof blid !== "string" || blid.length === 0) {
      throw new BlError(
        "blid must be a string with length greater than 0",
      ).code(803);
    } else if (!this.isValidBlid(blid)) {
      throw new BlError("blid is not a valid blid").code(803);
    }

    const receiverUserDetailId = blApiRequest.user!.details;

    const receiverMatches = await getAllMatchesForUser(
      receiverUserDetailId,
      this._matchStorage,
    );
    const receiverUserMatches = receiverMatches.filter(
      (match) => match._variant === MatchVariant.UserMatch,
    ) as UserMatch[];

    if (receiverUserMatches.length === 0) {
      throw new BlError("Receiver does not have any user matches");
    }

    let activeCustomerItems = [];
    try {
      activeCustomerItems =
        await new CustomerItemActiveBlid().getActiveCustomerItems(blid);
    } catch (e) {
      throw new BlError("blid not active").code(804);
    }
    if (activeCustomerItems.length !== 1) {
      throw new BlError("blid not active").code(804);
    }
    const customerItem = activeCustomerItems[0]!;

    const receiverUserMatch = receiverUserMatches.find((userMatch) =>
      userMatch.expectedItems.includes(customerItem.item),
    );

    if (!receiverUserMatch) {
      throw new BlError("Item not in receiver expectedItems").code(805);
    }

    if (receiverUserMatch.receivedBlIds.includes(customerItem.blid!)) {
      throw new BlError("Receiver has already received this item").code(806);
    }

    const receivedItemIds = await Promise.all(
      receiverUserMatch.receivedBlIds.map(async (blId) => {
        const uniqueItemQuery = new SEDbQuery();
        uniqueItemQuery.stringFilters = [{ fieldName: "blid", value: blId }];
        return (await this._uniqueItemStorage.getByQuery(uniqueItemQuery))[0]!
          .item;
      }),
    );

    if (receivedItemIds.includes(customerItem.item)) {
      throw new BlError("Receiver has already received this item").code(806);
    }

    const senderMatches = await getAllMatchesForUser(
      customerItem.customer,
      this._matchStorage,
    );
    const senderUserMatches = senderMatches.filter(
      (match) => match._variant === MatchVariant.UserMatch,
    );
    const senderUserMatch = senderUserMatches.find(
      (userMatch) =>
        userMatch.expectedItems.includes(customerItem.item) &&
        !userMatch.deliveredBlIds.includes(customerItem.blid!),
    );

    if (
      senderUserMatch === undefined ||
      receiverUserMatch.id !== senderUserMatch.id
    ) {
      userFeedback = `Boken du skannet tilhørte en annen elev enn den som ga deg den. Du skal beholde den, men eleven som ga deg boken er fortsatt ansvarlig for at den opprinnelige boken blir levert.`;
    }

    const orderValidator = new OrderValidator();

    await this._matchStorage.update(
      receiverUserMatch.id,
      {
        receivedBlIds: [...receiverUserMatch.receivedBlIds, customerItem.blid!],
      },
      new SystemUser(),
    );

    const receiverOrder = await createMatchOrder(
      customerItem,
      receiverUserDetailId,
      false,
      receiverUserMatch.deadlineOverrides,
    );

    const placedReceiverOrder = await this._orderStorage.add(
      receiverOrder,
      new SystemUser(),
    );
    await orderValidator.validate(placedReceiverOrder, false);

    const orderMovedToHandler = new OrderItemMovedFromOrderHandler();
    await orderMovedToHandler.updateOrderItems(placedReceiverOrder);

    await this.updateMatches(customerItem, senderUserMatch, senderMatches);

    const senderOrder = await createMatchOrder(
      customerItem,
      customerItem.customer,
      true,
    );

    const placedSenderOrder = await this._orderStorage.add(
      senderOrder,
      new SystemUser(),
    );
    await orderValidator.validate(placedSenderOrder, false);

    await this._customerItemStorage.update(
      customerItem.id,
      {
        returned: true,
      },
      new SystemUser(),
    );

    const customerItemGenerator = new OrderToCustomerItemGenerator();

    const generatedCustomerItems =
      await customerItemGenerator.generate(placedReceiverOrder);

    if (!generatedCustomerItems || generatedCustomerItems.length === 0) {
      throw new BlError("Failed to create new customer item");
    }

    await this._customerItemStorage.add(
      generatedCustomerItems[0]!,
      new SystemUser(),
    );

    return new BlapiResponse([{ feedback: userFeedback }]);
  }
}
