import { BlError, Match } from "@boklisten/bl-model";
import { Branch, CustomerItem, Item, Order } from "@boklisten/bl-model";
import { SEDbQuery } from "../../../query/se.db-query";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { matchSchema } from "../match.schema";
import { itemSchema } from "../../item/item.schema";
import { branchSchema } from "../../branch/branch.schema";

export async function createMatchOrder(
  customerItem: CustomerItem,
  userDetailId: string,
  isSender: boolean
): Promise<Order> {
  const itemStorage = new BlDocumentStorage<Item>(
    BlCollectionName.Items,
    itemSchema
  );
  const item = await itemStorage.get(String(customerItem.item));

  if (!item) {
    throw new BlError("Failed to get item");
  }

  const branchStorage = new BlDocumentStorage<Branch>(
    BlCollectionName.Branches,
    branchSchema
  );
  const branch = await branchStorage.get(
    String(customerItem.handoutInfo.handoutById)
  );

  const newRentPeriod = branch?.paymentInfo?.rentPeriods?.[0];

  if (!newRentPeriod?.date) {
    throw new BlError("Rent period not set for branch");
  }

  if (newRentPeriod.date === customerItem.deadline) {
    throw new BlError("Branch rent period is same is customer item deadline");
  }

  return {
    placed: true,
    payments: [],
    amount: 0,
    branch: branch.id,
    customer: userDetailId,
    byCustomer: true,
    orderItems: [
      {
        item: item.id,
        title: item.title,
        // TODO before merge: Update when @Lars publishes new version of bl-model
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        type: `match-${isSender ? "deliver" : "receive"}`,
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: new Date(),
          to: newRentPeriod.date,
          numberOfPeriods: 1,
          periodType: "semester",
        },
      },
    ],
  };
}

export async function getAllMatchesForUser(
  userDetailId: string
): Promise<Match[]> {
  const query = new SEDbQuery();
  query.objectIdFilters = [
    // By putting each value in an array, the filters are OR'd instead of AND'd
    { fieldName: "customer", value: [userDetailId] },
    { fieldName: "sender", value: [userDetailId] },
    { fieldName: "receiver", value: [userDetailId] },
  ];

  const matchStorage = new BlDocumentStorage(
    BlCollectionName.Matches,
    matchSchema
  );
  try {
    return (await matchStorage.getByQuery(query)) as Match[];
  } catch (e) {
    if (e instanceof BlError && e.getCode() === 702) {
      return [];
    }
    throw e;
  }
}
