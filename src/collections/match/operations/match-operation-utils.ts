import {
  BlError,
  Match,
  Branch,
  CustomerItem,
  Item,
  Order,
} from "@boklisten/bl-model";

import { isNullish } from "../../../helper/typescript-helpers";
import { SEDbQuery } from "../../../query/se.db-query";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { branchSchema } from "../../branch/branch.schema";
import { itemSchema } from "../../item/item.schema";
import { OrderActive } from "../../order/helpers/order-active/order-active";

export async function createMatchOrder(
  customerItem: CustomerItem,
  userDetailId: string,
  isSender: boolean,
  deadlineOverrides?: { [item: string]: string },
): Promise<Order> {
  const itemStorage = new BlDocumentStorage<Item>(
    BlCollectionName.Items,
    itemSchema,
  );
  const item = await itemStorage.get(customerItem.item);

  if (!item) {
    throw new BlError("Failed to get item");
  }

  const branchStorage = new BlDocumentStorage<Branch>(
    BlCollectionName.Branches,
    branchSchema,
  );
  if (isNullish(customerItem.handoutInfo)) {
    throw new BlError("No handoutInfo for customerItem").code(200);
  }
  const branch = await branchStorage.get(customerItem.handoutInfo.handoutById);

  const newRentPeriod = branch?.paymentInfo?.rentPeriods?.[0];

  if (!newRentPeriod?.date) {
    throw new BlError("Rent period not set for branch");
  }

  if (newRentPeriod.date === customerItem.deadline) {
    throw new BlError("Branch rent period is same is customer item deadline");
  }

  let movedFromOrder = undefined;

  if (!isSender) {
    const orderActive = new OrderActive();
    const activeReceiverOrders =
      await orderActive.getActiveOrders(userDetailId);
    const originalReceiverOrder = activeReceiverOrders.find((order) =>
      order.orderItems
        .filter((orderItem) => orderActive.isOrderItemActive(orderItem))
        .some((orderItem) => orderItem.item === customerItem.item),
    );
    if (originalReceiverOrder) {
      movedFromOrder = originalReceiverOrder.id;
    }
  }
  const deadlineOverride = deadlineOverrides?.[item.id];

  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    id: undefined,
    placed: true,
    payments: [],
    amount: 0,
    branch: branch.id,
    customer: userDetailId,
    byCustomer: true,
    pendingSignature: false,
    orderItems: [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      {
        movedFromOrder,
        item: item.id,
        title: item.title,
        blid: customerItem.blid,
        type: `match-${isSender ? "deliver" : "receive"}`,
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: new Date(),
          to: deadlineOverride
            ? new Date(deadlineOverride)
            : newRentPeriod.date,
          numberOfPeriods: 1,
          periodType: "semester",
        },
      },
    ],
  };
}

export async function getAllMatchesForUser(
  userDetailId: string,
  matchStorage: BlDocumentStorage<Match>,
): Promise<Match[]> {
  const query = new SEDbQuery();
  query.objectIdFilters = [
    // By putting each value in an array, the filters are OR'd instead of AND'd
    { fieldName: "customer", value: [userDetailId] },
    { fieldName: "sender", value: [userDetailId] },
    { fieldName: "receiver", value: [userDetailId] },
  ];

  try {
    return (await matchStorage.getByQuery(query)) as Match[];
  } catch (e) {
    if (e instanceof BlError && e.getCode() === 702) {
      return [];
    }
    throw e;
  }
}
