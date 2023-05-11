import { difference, intersect, union } from "../set-methods";
import {
  MatchableUser,
  MatchTypes,
  NewMatch,
  StandPickupMatch,
} from "./match-types";
import {
  copyAndSortUsers,
  groupUsersByNumberOfItems,
  removeFullyMatchedUsers,
  tryFindPartialMatch,
  tryFindOneWayMatch,
  tryFindTwoWayMatch,
} from "./match-utils";

export class MatchFinder {
  public senders: MatchableUser[];
  public receivers: MatchableUser[];
  public unmatchableItems: Set<string>;

  private matches: NewMatch[] = [];

  constructor(
    _senders: MatchableUser[],
    _receivers: MatchableUser[],
    outdatedItems: string[]
  ) {
    this.unmatchableItems = new Set(outdatedItems);
    this.receivers = copyAndSortUsers(_receivers);
    this.senders = copyAndSortUsers(_senders);
  }

  /**
   * Trigger generation of matches
   * @returns an optimal matching of the given senders and receivers
   */
  public generateMatches() {
    this.createMatches(tryFindTwoWayMatch, this.senders);
    this.createMatches(tryFindOneWayMatch, this.senders);

    const sortedSenderGroups = groupUsersByNumberOfItems(this.senders);

    for (const sortedSenderGroup of sortedSenderGroups) {
      this.createMatches(
        tryFindPartialMatch,
        sortedSenderGroup,
        sortedSenderGroups
      );
    }

    for (const receiver of this.receivers) {
      this.createStandPickupMatch(receiver);
    }

    return this.matches;
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
      this.createStandDeliveryMatch(sender);

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
          this.createStandDeliveryMatch(sender);
        }
        continue;
      }

      this.createUserMatch(sender, receiver);

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
   * Create a stand delivery match for all items unmatchable items that the sender has.
   * If the sender already has a stand match, append the items to that match instead
   * @param sender
   * @private
   */
  private createStandDeliveryMatch(sender: MatchableUser) {
    const deliveryItems = intersect(sender.items, this.unmatchableItems);

    if (deliveryItems.size === 0) {
      return;
    }

    const existingMatch = this.matches.find(
      (match) =>
        match.type === MatchTypes.StandDeliveryMatch &&
        match.senderId === sender.id
    );

    if (existingMatch !== undefined) {
      existingMatch.items = union(existingMatch.items, deliveryItems);
    } else {
      this.matches.push({
        senderId: sender.id,
        items: deliveryItems,
        type: MatchTypes.StandDeliveryMatch,
      });
    }

    sender.items = difference(sender.items, deliveryItems);
  }

  /**
   * Match all overlapping items between a sender and a receiver,
   * and remove their matched items
   * @param sender
   * @param receiver
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
   * Match all missing receiver items with the stand,
   * and append the match to the list of matches
   * @param receiver
   * @private
   */
  private createStandPickupMatch(receiver: MatchableUser) {
    const match: StandPickupMatch = {
      receiverId: receiver.id,
      items: receiver.items,
      type: MatchTypes.StandPickupMatch,
    };
    receiver.items = new Set();
    this.matches.push(match);
  }
}
