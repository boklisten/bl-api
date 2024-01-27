import {
  BlapiResponse,
  BlError,
  CustomerItem,
  Match,
  MatchVariant,
  Order,
  UserDetail,
  UserMatch,
} from "@boklisten/bl-model";

import {
  createMatchOrder,
  getAllMatchesForUser,
} from "./match-operation-utils";
import { SystemUser } from "../../../auth/permission/permission.service";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { customerItemSchema } from "../../customer-item/customer-item.schema";
import { CustomerItemActiveBlid } from "../../customer-item/helpers/customer-item-active-blid";
import { OrderToCustomerItemGenerator } from "../../customer-item/helpers/order-to-customer-item-generator";
import { OrderItemMovedFromOrderHandler } from "../../order/helpers/order-item-moved-from-order-handler/order-item-moved-from-order-handler";
import { OrderValidator } from "../../order/helpers/order-validator/order-validator";
import { orderSchema } from "../../order/order.schema";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { matchSchema } from "../match.schema";

export class MatchTransferItemOperation implements Operation {
  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private matchStorage?: BlDocumentStorage<Match>,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
  ) {
    this.matchStorage =
      matchStorage ??
      new BlDocumentStorage(BlCollectionName.Matches, matchSchema);
    this.userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
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

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    let userFeedback;
    const blid = blApiRequest?.data?.blid;
    if (!blid || typeof blid !== "string" || blid.length === 0) {
      throw new BlError(
        "blid must be a string with length greater than 0",
      ).code(803);
    } else if (!this.isValidBlid(blid)) {
      throw new BlError("blid is not a valid blid").code(803);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const receiverUserDetailId = blApiRequest.user.details;

    const receiverMatches = await getAllMatchesForUser(receiverUserDetailId);
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
    const customerItem = activeCustomerItems[0];

    const receiverUserMatch = receiverUserMatches.find((userMatch) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userMatch.expectedItems.includes(String(customerItem.item)),
    );

    if (!receiverUserMatch) {
      throw new BlError("Item not in receiver expectedItems").code(805);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (receiverUserMatch.receivedCustomerItems.includes(customerItem.id)) {
      throw new BlError("Receiver has already received this item").code(806);
    } // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const senderMatches = await getAllMatchesForUser(customerItem.customer);
    const senderUserMatches = senderMatches.filter(
      (match) => match._variant === MatchVariant.UserMatch,
    ) as UserMatch[];
    const senderUserMatch = senderUserMatches.find(
      (userMatch) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        userMatch.expectedItems.includes(String(customerItem.item)) &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        !userMatch.deliveredCustomerItems.includes(String(customerItem.item)),
    );

    if (
      senderUserMatch === undefined ||
      receiverUserMatch.id !== senderUserMatch.id
    ) {
      userFeedback = `Boken du har scannet tilhørte opprinnelig en annen kunde. Boken er nå registrert på deg, men avsender må fortsatt levere sin opprinnelige bok. Ta kontakt med stand for spørsmål.`;
    }

    const matchStorage = new BlDocumentStorage<Match>(
      BlCollectionName.Matches,
      matchSchema,
    );

    const orderStorage = new BlDocumentStorage<Order>(
      BlCollectionName.Orders,
      orderSchema,
    );

    const customerItemStorage = new BlDocumentStorage<CustomerItem>(
      BlCollectionName.CustomerItems,
      customerItemSchema,
    );

    const orderValidator = new OrderValidator();

    await matchStorage.update(
      receiverUserMatch.id,
      {
        receivedCustomerItems: [
          ...receiverUserMatch.receivedCustomerItems,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          customerItem.id,
        ],
      },
      new SystemUser(),
    );

    const receiverOrder = await createMatchOrder(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      customerItem,
      receiverUserDetailId,
      false,
    );

    const placedReceiverOrder = await orderStorage.add(
      receiverOrder,
      new SystemUser(),
    );
    await orderValidator.validate(placedReceiverOrder);

    const orderMovedToHandler = new OrderItemMovedFromOrderHandler();
    await orderMovedToHandler.updateOrderItems(placedReceiverOrder);

    if (senderUserMatch !== undefined) {
      await matchStorage.update(
        senderUserMatch.id,
        {
          deliveredCustomerItems: [
            ...senderUserMatch.deliveredCustomerItems,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            customerItem.id,
          ],
        },
        new SystemUser(),
      );

      const senderOrder = await createMatchOrder(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        customerItem,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        customerItem.customer,
        true,
      );

      const placedSenderOrder = await orderStorage.add(
        senderOrder,
        new SystemUser(),
      );
      await orderValidator.validate(placedSenderOrder);
    }

    await customerItemStorage.update(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await customerItemStorage.add(generatedCustomerItems[0], new SystemUser());

    return new BlapiResponse([{ feedback: userFeedback }]);
  }
}
