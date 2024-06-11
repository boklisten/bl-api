import {
  CustomerItem,
  Match,
  Order,
  StandMatch,
  UserMatch,
} from "@boklisten/bl-model";
import { ObjectId } from "mongodb";

import { isBoolean } from "../../../helper/typescript-helpers";
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
  branches: string[];
  standLocation: string;
  userMatchLocations: MatchLocation[];
  startTime: string;
  deadlineBefore: string;
  matchMeetingDurationInMS: number;
  includeSenderItemsFromOtherBranches: boolean;
  additionalReceiverItems: { branch: string; items: string[] }[];
  deadlineOverrides: { item: string; deadline: string }[];
}

export function candidateMatchToMatch(
  candidate: MatchWithMeetingInfo,
  deadlineOverrides: { item: string; deadline: string }[],
): Match {
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
        deadlineOverrides,
      );
  }
}

/**
 * Get the branches' items which users need to return, grouped by user.
 *
 * @param branchIds The IDs of branches to search for users and items
 * @param deadlineBefore Select customer items that have a deadlineBefore between now() and this deadlineBefore
 * @param includeSenderItemsFromOtherBranches whether the remainder of the items that a customer has in possession should be added to the match, even though they were not handed out at the specified branchIds
 * @param customerItemStorage
 */
export async function getMatchableSenders(
  branchIds: string[],
  deadlineBefore: string,
  includeSenderItemsFromOtherBranches: boolean,
  customerItemStorage: BlDocumentStorage<CustomerItem>,
): Promise<MatchableUser[]> {
  const groupByCustomerStep = {
    $group: {
      _id: "$customer",
      id: { $first: "$customer" },
      items: { $addToSet: "$item" },
    },
  };

  let aggregatedSenders = (await customerItemStorage.aggregate([
    {
      $match: {
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
    groupByCustomerStep,
  ])) as { id: string; items: string[] }[];

  if (includeSenderItemsFromOtherBranches) {
    aggregatedSenders = (await customerItemStorage.aggregate([
      {
        $match: {
          customer: { $in: aggregatedSenders.map((sender) => sender.id) },
          returned: false,
          buyout: false,
          cancel: false,
          buyback: false,
          deadline: { $gt: new Date(), $lte: new Date(deadlineBefore) },
        },
      },
      groupByCustomerStep,
    ])) as { id: string; items: string[] }[];
  }

  return aggregatedSenders.map((sender) => ({
    id: sender.id,
    items: new Set(sender.items),
  }));
}

/**
 * Get the branches' items which need to be provided to users, grouped by user.
 *
 * @param branchIds The IDs of branches to search for users and items
 * @param orderStorage
 * @param additionalReceiverItems items that all receivers in the predefined branches want
 */
export async function getMatchableReceivers(
  branchIds: string[],
  orderStorage: BlDocumentStorage<Order>,
  additionalReceiverItems: { branch: string; items: string[] }[],
): Promise<MatchableUser[]> {
  const aggregatedReceivers = (await orderStorage.aggregate([
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
    {
      $unwind: "$orderItems",
    },
    {
      $group: {
        _id: "$customer",
        id: { $first: "$customer" },
        items: { $addToSet: "$orderItems.item" },
        branches: { $addToSet: "$branch" },
      },
    },
  ])) as { id: string; items: string[]; branches: string[] }[];

  for (const branchReceiverItems of additionalReceiverItems) {
    for (const receiver of aggregatedReceivers) {
      if (receiver.branches.includes(branchReceiverItems.branch)) {
        receiver.items = [...receiver.items, ...branchReceiverItems.items];
      }
    }
  }

  return aggregatedReceivers.map((receiver) => ({
    id: receiver.id,
    items: new Set(receiver.items),
  }));
}

export function verifyMatcherSpec(
  matcherSpec: unknown,
): matcherSpec is MatcherSpec {
  const m = matcherSpec as Record<string, unknown>;
  return (
    m &&
    Array.isArray(m["branches"]) &&
    Array.isArray(m["userMatchLocations"]) &&
    m["branches"].every(
      (branchId) => typeof branchId === "string" && branchId.length === 24,
    ) &&
    typeof m["standLocation"] === "string" &&
    m["standLocation"].length > 0 &&
    m["userMatchLocations"].every(
      (location) =>
        typeof location.name === "string" &&
        location.name.length > 0 &&
        (location.simultaneousMatchLimit === undefined ||
          (Number.isInteger(location.simultaneousMatchLimit) &&
            location.simultaneousMatchLimit > 0)),
    ) &&
    typeof m["startTime"] === "string" &&
    !isNaN(new Date(m["startTime"]).getTime()) &&
    typeof m["deadlineBefore"] === "string" &&
    !isNaN(new Date(m["deadlineBefore"]).getTime()) &&
    new Date(m["deadlineBefore"]).getTime() > new Date().getTime() &&
    typeof m["matchMeetingDurationInMS"] === "number" &&
    !isNaN(m["matchMeetingDurationInMS"]) &&
    isBoolean(m["includeSenderItemsFromOtherBranches"]) &&
    Array.isArray(m["additionalReceiverItems"]) &&
    m["additionalReceiverItems"].every(
      (entry) =>
        typeof entry["branch"] === "string" &&
        entry["branch"].length === 24 &&
        Array.isArray(entry["items"]) &&
        entry["items"].every(
          (itemId) => typeof itemId === "string" && itemId.length === 24,
        ),
    ) &&
    Array.isArray(m["deadlineOverrides"]) &&
    m["deadlineOverrides"].every(
      (override) =>
        typeof override["item"] === "string" &&
        override["item"].length === 24 &&
        typeof override["deadline"] === "string" &&
        !isNaN(new Date(override["deadline"]).getTime()),
    )
  );
}
