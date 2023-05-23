import { difference, intersect, union } from "../set-methods";
import {
  MatchableUser,
  MatchTypes,
  NewMatch,
  StandDeliveryMatch,
  StandPickupMatch,
} from "./match-types";
import {
  calculateItemDifferences,
  calculateUnmatchableItems,
  canFullStandMatch,
  copyUsers,
  groupItemsByCount,
  groupUsersByNumberOfItems,
  removeFullyMatchedUsers,
  sortUsersForPartialMatching,
  sortUsersNumberOfItemsDescending,
  tryFindOneWayMatch,
  tryFindPartialMatch,
  tryFindTwoWayMatch,
  updateItemDifferences,
} from "./match-utils";

export class MatchFinder {
  public senders: MatchableUser[];
  public receivers: MatchableUser[];
  public unmatchableItems: Set<string> = new Set();

  private matches: NewMatch[] = [];
  private readonly MAX_USER_MATCH_COUNT = 2;

  constructor(_senders: MatchableUser[], _receivers: MatchableUser[]) {
    this.receivers = copyUsers(_receivers);
    this.senders = copyUsers(_senders);
  }

  /**
   * Trigger generation of matches
   * @returns an optimal matching of the given senders and receivers
   */
  public generateMatches() {
    // First remove the perfect matches
    this.createMatches(tryFindTwoWayMatch, this.senders);

    // Fulfill the largest possible senders with the best receivers
    sortUsersNumberOfItemsDescending(this.senders);
    sortUsersNumberOfItemsDescending(this.receivers);
    this.createMatches(tryFindOneWayMatch, this.senders);

    // Remove all unmatchable items
    this.standMatchUnmatchableItems();
    // We might have opened up for some TwoWay matches after purging the unmatchable items
    this.createMatches(tryFindTwoWayMatch, this.senders);
    // Edge case, but removing TwoWay matches might make some more items unmatchable
    this.standMatchUnmatchableItems();

    // Fully match the largest possible senders and receivers with the stand
    sortUsersNumberOfItemsDescending(this.senders);
    sortUsersNumberOfItemsDescending(this.receivers);
    this.createFullStandMatches();

    // In testing with large datasets, doing this sorting
    // provided much better results for partial matching
    sortUsersForPartialMatching(this.senders, this.matches);
    sortUsersForPartialMatching(this.receivers, this.matches);
    const sortedSenderGroups = groupUsersByNumberOfItems(this.senders);

    for (const sortedSenderGroup of sortedSenderGroups) {
      this.createMatches(
        tryFindPartialMatch,
        sortedSenderGroup,
        sortedSenderGroups
      );
    }

    // Create stand pickups for the remainder of the items
    for (const receiver of this.receivers) {
      this.createStandMatch(
        receiver,
        receiver.items,
        MatchTypes.StandPickupMatch
      );
    }

    this.senders = removeFullyMatchedUsers(this.senders);
    this.receivers = removeFullyMatchedUsers(this.receivers);

    // Verify that all senders and receivers have been fulfilled
    if (this.senders.length > 0 || this.receivers.length > 0) {
      throw new Error("Some senders or receivers did not receive a match!");
    }

    return this.matches;
  }

  /**
   * Identifies items that cannot be matched
   * (no one wants them, or no one has them) and creates stand matches for them.
   * For each sender, a StandDeliveryMatch is created for the unmatchable sender items.
   * For each receiver, a StandPickupMatch is created for the unmatchable receiver items.
   * @private
   */
  private standMatchUnmatchableItems() {
    const { unmatchableSenderItems, unmatchableReceiverItems } =
      calculateUnmatchableItems(this.senders, this.receivers);
    this.unmatchableItems = unmatchableSenderItems;

    for (const sender of this.senders) {
      this.createStandMatch(
        sender,
        this.unmatchableItems,
        MatchTypes.StandDeliveryMatch
      );
    }

    for (const receiver of this.receivers) {
      this.createStandMatch(
        receiver,
        unmatchableReceiverItems,
        MatchTypes.StandPickupMatch
      );
    }
  }

  /**
   * Creates initial stand matches for senders and receivers
   * This method groups sender and receiver items by count and calculates the difference between them
   * After that, it checks if a full stand match can be made for each sender and receiver
   * If a full stand match can be made, it updates the difference and creates a stand match
   * @private
   */
  private createFullStandMatches() {
    const senderItems = groupItemsByCount(this.senders);
    const receiverItems = groupItemsByCount(this.receivers);
    const itemDifferences = calculateItemDifferences(
      senderItems,
      receiverItems
    );

    this.createDifferenceMinimizingMatches(
      this.senders,
      itemDifferences,
      MatchTypes.StandDeliveryMatch
    );
    this.createDifferenceMinimizingMatches(
      this.receivers,
      itemDifferences,
      MatchTypes.StandPickupMatch
    );
  }

  /**
   * Creates stand matches for a list of users
   * This method checks if a full stand match can be made for each user
   * If a full stand match can be made, it updates the difference in counts and creates a stand match
   * @param users - The users for whom to create matches
   * @param itemDifferences - The differences in item counts
   * @param matchType - The type of match to create
   * @private
   */
  private createDifferenceMinimizingMatches(
    users: MatchableUser[],
    itemDifferences: { [key: string]: number },
    matchType: MatchTypes.StandDeliveryMatch | MatchTypes.StandPickupMatch
  ) {
    for (const user of users) {
      if (canFullStandMatch(user, itemDifferences, matchType)) {
        updateItemDifferences(user.items, itemDifferences, matchType);
        this.createStandMatch(user, user.items, matchType);
      }
    }
  }

  /**
   * This method checks if a user has reached the maximum limit for UserMatches,
   * and if so, creates a stand match for the user. The type of the stand match (pickup or delivery)
   * depends on the provided standMatchType parameter.
   *
   * @param user - The user (either a sender or receiver) for whom the stand match may be created.
   *
   * @param standMatchType - The type of the stand match to create. This also determines whether the method checks
   *                         the user's senderId or receiverId when looking for matches.
   *
   * @private
   */
  private createStandMatchIfReachedMatchLimit(
    user: MatchableUser,
    standMatchType: MatchTypes.StandPickupMatch | MatchTypes.StandDeliveryMatch
  ) {
    const matchTypeId =
      standMatchType === MatchTypes.StandDeliveryMatch
        ? "senderId"
        : "receiverId";
    let count = 0;

    const isLimited = this.matches.some((match) => {
      if (
        match.type === MatchTypes.UserMatch &&
        match[matchTypeId] === user.id
      ) {
        count++;
      }
      return count >= this.MAX_USER_MATCH_COUNT;
    });

    if (isLimited) {
      this.createStandMatch(user, user.items, standMatchType);
    }
  }

  /**
   * Create matches for senders fround from a given matchFinder function
   * Create delivery matches for unmatchable items
   * @param matchFinder a function that finds a match for a given sender
   * @param senders the senders to be matched
   * @param sortedSenderGroups sender groups required for partial matching
   * @private
   */
  private createMatches(
    matchFinder: (
      sender: MatchableUser,
      receivers: MatchableUser[]
    ) => MatchableUser,
    senders: MatchableUser[],
    sortedSenderGroups?: MatchableUser[][]
  ) {
    for (const sender of senders) {
      // Match unmatchable items with stand
      this.createStandMatch(
        sender,
        this.unmatchableItems,
        MatchTypes.StandDeliveryMatch
      );

      // If all items are unmatchable, the sender is fully matched
      if (sender.items.size === 0) {
        continue;
      }

      const receiver = matchFinder(sender, this.receivers);

      if (receiver === null) {
        if (matchFinder === tryFindPartialMatch) {
          // If there is no partial receiver, no one wants any of these items.
          // Thus, the items should be delivered to a stand and marked unmatchable
          this.unmatchableItems = union(this.unmatchableItems, sender.items);
          this.createStandMatch(
            sender,
            this.unmatchableItems,
            MatchTypes.StandDeliveryMatch
          );
        }
        continue;
      }

      this.createUserMatch(sender, receiver);

      this.createStandMatchIfReachedMatchLimit(
        sender,
        MatchTypes.StandDeliveryMatch
      );
      this.createStandMatchIfReachedMatchLimit(
        receiver,
        MatchTypes.StandPickupMatch
      );

      // Add the partially matched sender to a new group, so that the remainder of the items can get matched later
      if (matchFinder === tryFindPartialMatch && sender.items.size > 0) {
        // Needs to be placed in front of the set, so that it is prioritized when matching that group
        const groupIndex = sortedSenderGroups.length - 1 - sender.items.size;
        sortedSenderGroups[groupIndex] = [
          sender,
          ...sortedSenderGroups[groupIndex],
        ];
      }
    }

    // Cleanup senders and receivers
    this.senders = removeFullyMatchedUsers(this.senders);
    this.receivers = removeFullyMatchedUsers(this.receivers);
  }

  /**
   * Match all overlapping items between a sender and a receiver,
   * and remove their matched items.
   * @param sender - User sending items.
   * @param receiver - User receiving items.
   * @private
   */
  private createUserMatch(sender: MatchableUser, receiver: MatchableUser) {
    const matchableItems = intersect(sender.items, receiver.items);
    this.matches.push({
      senderId: sender.id,
      receiverId: receiver.id,
      items: matchableItems,
      type: MatchTypes.UserMatch,
    });

    receiver.items = difference(receiver.items, matchableItems);
    sender.items = difference(sender.items, matchableItems);
  }

  /**
   * Match all specified items with the stand,
   * as either a delivery or pickup match,
   * and append the match to the list of matches
   * @param user
   * @param items the items to be picked up
   * @param matchType either pickup or delivery
   * @private
   */
  private createStandMatch(
    user: MatchableUser,
    items: Set<string>,
    matchType: MatchTypes.StandDeliveryMatch | MatchTypes.StandPickupMatch
  ) {
    const deliveryItems = intersect(user.items, items);
    if (deliveryItems.size === 0) {
      return;
    }

    const existingMatch = this.matches.find(
      (match) =>
        match.type === matchType &&
        (("receiverId" in match && match.receiverId === user.id) ||
          ("senderId" in match && match.senderId === user.id))
    );

    if (existingMatch) {
      existingMatch.items = union(existingMatch.items, deliveryItems);
      user.items = difference(user.items, deliveryItems);
      return;
    }

    const match: { [key: string]: unknown } = {
      items: deliveryItems,
      type: matchType,
    };

    if (matchType === MatchTypes.StandDeliveryMatch) {
      match.senderId = user.id;
    } else {
      match.receiverId = user.id;
    }

    // Typescript is fun
    this.matches.push(<StandDeliveryMatch | StandPickupMatch>(<unknown>match));

    user.items = difference(user.items, deliveryItems);
  }
}
