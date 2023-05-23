import { MatchableUser, MatchTypes, NewMatch } from "./match-types";
import { difference, hasDifference, intersect } from "../set-methods";

/**
 * Create a sorted deep copy of the input users
 * @param users
 */
export function copyUsers(users: MatchableUser[]): MatchableUser[] {
  return users.map((user) => ({
    id: user.id,
    items: new Set(user.items),
  }));
}

/**
 * Sort users in place, by descending number of items
 * @param users
 */
export function sortUsersNumberOfItemsDescending(users: MatchableUser[]) {
  users.sort((a, b) => (a.items.size > b.items.size ? -1 : 1));
}

/**
 * Sort users by ascending number of items, and prioritize those that already have a standMatch
 * @param users
 * @param matches
 */
export function sortUsersForPartialMatching(
  users: MatchableUser[],
  matches: NewMatch[]
) {
  const hasStandMatch = (user: MatchableUser) =>
    matches.some(
      (match) =>
        (match.type === MatchTypes.StandDeliveryMatch &&
          match.senderId === user.id) ||
        (match.type === MatchTypes.StandPickupMatch &&
          match.receiverId === user.id)
    );

  users.sort((a, b) => {
    const aHasStandMatch = hasStandMatch(a);
    const bHasStandMatch = hasStandMatch(b);
    if (aHasStandMatch && !bHasStandMatch) {
      return -1;
    }

    if (!aHasStandMatch && !bHasStandMatch) {
      return 1;
    }

    return a.items.size > b.items.size ? 1 : -1;
  });
}

/**
 * Create a list of Sets, where each set has users with x items.
 * For instance, list[1] has users with only one item, list[2] has users with two items.
 * Finally, the list is reversed, so that list[0] contains the users with the highest number of items
 * @param users
 */
export function groupUsersByNumberOfItems(
  users: MatchableUser[]
): MatchableUser[][] {
  const maxNumberOfItems = users.reduce(
    (currentMax, nextUser) => Math.max(currentMax, nextUser.items.size),
    0
  );

  const sortedUserGroups: MatchableUser[][] = [
    ...Array(maxNumberOfItems + 1),
  ].map(() => []);

  for (const user of users) {
    if (user.items.size > 0) {
      const userGroup = sortedUserGroups[user.items.size];
      if (userGroup === undefined) {
        throw new Error(
          "SortedSenderGroups should have as many entries as the maximum number of sender items"
        );
      }
      userGroup.push(user);
    }
  }

  return sortedUserGroups.reverse();
}

/**
 * Removes fully matched users, aka. users that have no items
 *
 * @param users the set of dirty users
 * @returns a copy of the users without the fully matched users
 */
export function removeFullyMatchedUsers(
  users: MatchableUser[]
): MatchableUser[] {
  return users.filter((user) => user.items.size > 0);
}

/**
 * Try to find a receiver that has the same items as the sender,
 * so that the sender gets rid of all his books. The receiver
 * should have as few extra items as possible, to make him easy to match later.
 * @param sender The sender to be matched
 * @param receivers The receivers to match against
 */
export function tryFindOneWayMatch(
  sender: MatchableUser,
  receivers: MatchableUser[]
): MatchableUser | null {
  return receivers.reduce((best: MatchableUser | null, next) => {
    return !hasDifference(sender.items, next.items) &&
      (best === null || next.items.size < best.items.size)
      ? next
      : best;
  }, null);
}

/**
 * Try to find a receiver that have the exact same items
 * as the sender. These two are "perfect matches", as they
 * only have to interact with one person when matching.
 * @param sender The sender to be matched
 * @param receivers The receivers to match against
 */
export function tryFindTwoWayMatch(
  sender: MatchableUser,
  receivers: MatchableUser[]
): MatchableUser | null {
  return (
    receivers.find(
      (receiver) =>
        !hasDifference(sender.items, receiver.items) &&
        !hasDifference(receiver.items, sender.items)
    ) ?? null
  );
}

/**
 * Try to find a receiver that wants as many items as possible from the sender
 * @param sender The sender to be matched
 * @param receivers The receivers to match against
 */
export function tryFindPartialMatch(
  sender: MatchableUser,
  receivers: MatchableUser[]
): MatchableUser | null {
  let bestReceiver: MatchableUser | null = null;
  for (const receiver of receivers) {
    const matchableItems = intersect(sender.items, receiver.items);
    const bestMatchableItems = intersect(
      sender.items,
      bestReceiver?.items ?? new Set()
    );

    if (matchableItems.size > bestMatchableItems.size) {
      // If the match only lacks one item, it is the best case
      if (bestMatchableItems.size >= sender.items.size - 1) {
        return receiver;
      }

      bestReceiver = receiver;
    }
  }

  return bestReceiver;
}

/**
 * Create an overview of many of each item a list of users has or want
 * @param users
 */
export function groupItemsByCount(users: MatchableUser[]): {
  [key: string]: number;
} {
  return users.reduce((acc, next) => {
    for (const item of next.items) {
      acc[item] = item in acc ? acc[item] + 1 : 1;
    }
    return acc;
  }, {});
}

/**
 * Calculates the difference in count for each item between senders and receivers.
 * @param groupedSenderItems - The grouped items of the senders.
 * @param groupedReceiverItems - The grouped items of the receivers.
 * @returns An object where the keys are the items and the values are the differences in counts.
 * @throws If there is a missing key in the grouped items.
 * @private
 */
export function calculateItemDifferences(
  groupedSenderItems: { [key: string]: number },
  groupedReceiverItems: { [key: string]: number }
) {
  return Object.keys(groupedReceiverItems).reduce((diff, item) => {
    const senderItemCount = groupedSenderItems[item];
    const receiverItemCount = groupedReceiverItems[item];

    if (senderItemCount === undefined || receiverItemCount === undefined) {
      throw new Error(
        "Missing key in grouped items. Forgot to match unmatchable sender and receiver items?"
      );
    }

    return {
      ...diff,
      [item]: senderItemCount - receiverItemCount,
    };
  }, {});
}

/**
 * Checks if a full stand match can be made for a user
 * @param user - The user to check
 * @param itemDifferences - The differences in item counts
 * @param matchType - The type of match to check
 * @returns True if a full stand match can be made, false otherwise
 * @private
 *
 **/
export function canFullStandMatch(
  user: MatchableUser,
  itemDifferences: { [key: string]: number },
  matchType: MatchTypes.StandDeliveryMatch | MatchTypes.StandPickupMatch
) {
  return Array.from(user.items).every((item) => {
    return matchType === MatchTypes.StandDeliveryMatch
      ? (itemDifferences[item] ?? 0) > 0
      : (itemDifferences[item] ?? 0) < 0;
  });
}

/**
 * Updates the difference count for each item of a user
 * @param items - The items to update the difference for
 * @param itemDifferences - The differences in item counts
 * @param matchType - The type of match that has been made
 * @private
 */
export function updateItemDifferences(
  items: Set<string>,
  itemDifferences: { [key: string]: number },
  matchType: MatchTypes.StandDeliveryMatch | MatchTypes.StandPickupMatch
) {
  const modifier = matchType === MatchTypes.StandDeliveryMatch ? -1 : 1;

  for (const item of items) {
    itemDifferences[item] = (itemDifferences[item] ?? 0) + modifier;
  }
}

/**
 * Calculate which items have no overlap between sender and receivers.
 * Aka. either no one wants the items, or no one has the items
 * @param senders
 * @param receivers
 */
export function calculateUnmatchableItems(
  senders: MatchableUser[],
  receivers: MatchableUser[]
): {
  unmatchableSenderItems: Set<string>;
  unmatchableReceiverItems: Set<string>;
} {
  const requiredSenderItems = new Set(
    senders.flatMap((user) => [...user.items])
  );
  const requiredReceiverItems = new Set(
    receivers.flatMap((user) => [...user.items])
  );
  const unmatchableSenderItems = difference(
    requiredSenderItems,
    requiredReceiverItems
  );
  const unmatchableReceiverItems = difference(
    requiredReceiverItems,
    requiredSenderItems
  );

  return { unmatchableSenderItems, unmatchableReceiverItems };
}
