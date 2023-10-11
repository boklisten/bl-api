import {
  CustomerItem,
  Match,
  Order,
  StandMatch,
  UserMatch,
} from "@boklisten/bl-model";
import { ObjectId } from "mongodb";

import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import {
  CandidateMatchVariant,
  MatchableUser,
  MatchLocation,
  MatchWithMeetingInfo,
} from "../helpers/match-finder-2/match-types";

/**
 * The information required to generate matches.
 */
export interface MatcherSpec {
  senderBranches: string[];
  receiverBranches: string[];
  standLocation: string;
  userMatchLocations: MatchLocation[];
  startTime: string;
  deadlineBefore: string;
}

export function candidateMatchToMatch(candidate: MatchWithMeetingInfo): Match {
  switch (candidate.variant) {
    case CandidateMatchVariant.StandMatch:
      return new StandMatch(
        candidate.userId,
        Array.from(candidate.handoffItems),
        Array.from(candidate.pickupItems),
        candidate.meetingInfo,
      );
    case CandidateMatchVariant.UserMatch:
      return new UserMatch(
        candidate.senderId,
        candidate.receiverId,
        Array.from(candidate.items),
        candidate.meetingInfo,
      );
  }
}

/**
 * Get the branches' items which users need to return, grouped by user.
 *
 * @param branchIds The IDs of branches to search for users and items
 * @param deadlineBefore Select customer items that have a deadlineBefore between now() and this deadlineBefore
 * @param customerItemStorage
 */
export async function getMatchableSenders(
  branchIds: string[],
  deadlineBefore: string,
  customerItemStorage: BlDocumentStorage<CustomerItem>,
): Promise<MatchableUser[]> {
  const branchCustomerItems = await customerItemStorage.aggregate([
    {
      $match: {
        // TODO: Check that the book is going to be returned this match session/semester
        returned: false,
        buyout: false,
        cancel: false,
        buyback: false,
        "handoutInfo.handoutBy": "branch",
        "handoutInfo.handoutById": {
          $in: branchIds.map((branchId) => new ObjectId(branchId)),
        },
        deadline: { $gt: new Date(), $lte: new Date(deadlineBefore) },
      },
    },
  ]);

  return groupItemsByUser(
    branchCustomerItems,
    (customerItem) => customerItem.customer.toString(),
    (customerItem) => [customerItem.item.toString()],
  );
}

/**
 * Get the branches' items which need to be provided to users, grouped by user.
 *
 * @param branchIds The IDs of branches to search for users and items
 * @param orderStorage
 */
export async function getMatchableReceivers(
  branchIds: string[],
  orderStorage: BlDocumentStorage<Order>,
): Promise<MatchableUser[]> {
  const branchOrders = await orderStorage.aggregate([
    {
      $match: {
        placed: true,
        byCustomer: true,
        handoutByDelivery: { $ne: true },
        branch: {
          $in: branchIds.map((branchId) => new ObjectId(branchId)),
        },
      },
    },
    {
      $addFields: {
        orderItems: {
          $filter: {
            input: "$orderItems",
            as: "orderItem",
            cond: {
              $and: [
                { $not: "$$orderItem.handout" },
                { $not: "$$orderItem.movedToOrder" },
                {
                  $in: ["$$orderItem.type", ["rent", "partly-payment"]],
                },
              ],
            },
          },
        },
      },
    },
    {
      $match: {
        $expr: {
          $gt: [{ $size: "$orderItems" }, 0],
        },
      },
    },
  ]);
  return groupItemsByUser(
    branchOrders,
    (order) => order.customer.toString(),
    (order) => order.orderItems.map((oi) => oi.item.toString()),
  );
}

export function verifyMatcherSpec(
  matcherSpec: unknown,
): matcherSpec is MatcherSpec {
  const m = matcherSpec as Record<string, unknown>;
  return (
    m &&
    Array.isArray(m.senderBranches) &&
    Array.isArray(m.receiverBranches) &&
    Array.isArray(m.userMatchLocations) &&
    m.senderBranches.every(
      (branchId) => typeof branchId === "string" && branchId.length === 24,
    ) &&
    m.receiverBranches.every(
      (branchId) => typeof branchId === "string" && branchId.length === 24,
    ) &&
    typeof m.standLocation === "string" &&
    m.standLocation.length > 0 &&
    m.userMatchLocations.every(
      (location) =>
        typeof location.name === "string" &&
        location.name.length > 0 &&
        (location.simultaneousMatchLimit === undefined ||
          (Number.isInteger(location.simultaneousMatchLimit) &&
            location.simultaneousMatchLimit > 0)),
    ) &&
    typeof m.startTime === "string" &&
    !isNaN(new Date(m.startTime).getTime()) &&
    typeof m.deadlineBefore === "string" &&
    !isNaN(new Date(m.deadlineBefore).getTime()) &&
    new Date(m.deadlineBefore).getTime() > new Date().getTime()
  );
}

/**
 * Reduce a set of documents to a list of users and their associated items.
 *
 * Which user is associated with which document and what their items are is
 * defined by the provided selectors. If items are added to a user from several
 * documents, all the unique ones are included in the result.
 *
 * @param fromDocuments The list of documents to gather users and items from
 * @param selectUserId A function which given a document returns the user
 * associated with that document
 * @param selectItems A function which given a document returns the items
 * the user is associated with through that document
 */
function groupItemsByUser<T>(
  fromDocuments: T[],
  selectUserId: (document: T) => string,
  selectItems: (document: T) => string[],
): MatchableUser[] {
  const itemsByUserId: Map<string, string[]> = new Map();
  for (const document of fromDocuments) {
    const items = itemsByUserId.get(selectUserId(document)) ?? [];
    itemsByUserId.set(selectUserId(document), items);
    items.push(...selectItems(document));
  }
  return Array.from(itemsByUserId.entries()).map(([id, items]) => ({
    id,
    items: new Set(items),
  }));
}
