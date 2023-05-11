import { CandidateMatch, CandidateMatchVariant, MatchableUser } from "../helpers/match-finder-2/match-types";
import { CustomerItem, Match, Order, StandMatch, UserMatch } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { ObjectId } from "mongodb";

export interface MatcherSpec {
  senderBranches: string[];
  receiverBranches: string[];
}

export function candidateMatchToMatch(
  candidate: CandidateMatch,
): Match {
  const meetingInfo: Match["meetingInfo"] = {
    location: "Pingala",
    date: new Date(2025, 12),
  };
  switch (candidate.variant) {
    case CandidateMatchVariant.StandMatch:
      return new StandMatch(
        candidate.userId,
        Array.from(candidate.handoffItems),
        Array.from(candidate.pickupItems),
        meetingInfo
      );
    case CandidateMatchVariant.UserMatch:
      return new UserMatch(
        candidate.senderId,
        candidate.receiverId,
        Array.from(candidate.items),
        meetingInfo
      );
  }
}

export async function getSenders(
  branchIds: string[],
  customerItemStorage: BlDocumentStorage<CustomerItem>
): Promise<MatchableUser[]> {
  const branchCustomerItems = await customerItemStorage.aggregate([
    {
      $match: {
        // TODO: Check that the book is going to be returned this match session/semester
        active: true,
        "handoutInfo.handoutBy": "branch",
        "handoutInfo.handoutById": {
          $in: branchIds.map((branchId) => new ObjectId(branchId))
        },
      },
    },
  ]);

  const itemsByUserId: Map<string, Set<string>> = new Map();
  for (const customerItem of branchCustomerItems) {
    const items = itemsByUserId.get(customerItem.customer.toString()) ?? new Set();
    itemsByUserId.set(customerItem.customer.toString(), items);
    items.add(customerItem.item.toString());
  }
  return Array.from(itemsByUserId.entries()).map(([id, items]) => ({
    id,
    items
  }));
}

export async function getReceivers(branchIds: string[], orderStorage: BlDocumentStorage<Order>): Promise<MatchableUser[]> {
  const branchOrders = await orderStorage.aggregate([
    {
      $match: {
        active: true,
        branch: {
          $in: branchIds.map((branchId) => new ObjectId(branchId)),
        },
      },
    },
  ]);
  const itemsByUserId: Map<string, string[]> = new Map();
  for (const order of branchOrders) {
    const items = itemsByUserId.get(order.customer.toString()) ?? [];
    itemsByUserId.set(order.customer.toString(), items);
    items.push(...order.orderItems.map(oi => oi.item.toString()));
  }
  return Array.from(itemsByUserId.entries()).map(([id, items]) => ({
    id,
    items: new Set(items),
  }));
}

export function verifyMatcherSpec(matcherSpec: unknown): matcherSpec is MatcherSpec {
  const m = matcherSpec as Record<string, unknown>;
  return (
    m &&
    m.senderBranches &&
    typeof m.senderBranches === "object" &&
    m.receiverBranches &&
    typeof m.receiverBranches === "object" &&
    m.senderBranches[0] &&
    typeof m.senderBranches[0] === "string" &&
    m.receiverBranches[0] &&
    typeof m.receiverBranches[0] === "string"
  );
}
