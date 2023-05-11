import { MatchableUser } from "./match-types";
import { hasDifference, intersect } from "../set-methods";

/**
 * Create a sorted deep copy of the input users. Sorted by number of items descending
 * @param users
 */
export function copyAndSortUsers(users: MatchableUser[]): MatchableUser[] {
  return users
    .map((user) => ({
      id: user.id,
      items: new Set(user.items),
    }))
    .sort((a, b) => (a.items.size > b.items.size ? -1 : 1));
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
