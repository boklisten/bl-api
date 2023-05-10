import { difference, hasDifference, intersect, union } from "../set-methods";
import {
  MatchableUser,
  MatchTypes,
  NewMatch,
  StandDeliveryMatch,
  StandPickupMatch,
} from "./matchTypes";
import { copyUsers } from "./match-utils";

export class MatchFinder {
  public senders: Set<MatchableUser>;
  public receivers: Set<MatchableUser>;
  private matches: Set<NewMatch> = new Set();
  public unmatchableItems: Set<string>;

  private groupUsersByNumberOfItems(
    users: Set<MatchableUser>
  ): Set<MatchableUser>[] {
    let max = 0;
    for (const user of users) {
      max = Math.max(max, user.items.size);
    }

    const sortedUserGroups: Set<MatchableUser>[] = [...Array(max + 1)].map(
      () => new Set()
    );

    for (const user of users) {
      if (user.items.size > 0) {
        const userGroup = sortedUserGroups[user.items.size];
        if (userGroup === undefined) {
          throw new Error(
            "SortedSenderGroups should have as many entries as the maximum number of sender items"
          );
        }
        userGroup.add(user);
      }
    }

    return sortedUserGroups.reverse();
  }

  private tryFindFullyMatchingReceiver(
    sender: MatchableUser
  ): MatchableUser | null {
    let bestReceiver = null;
    let bestDiff = null;
    const matchableSenderItems = difference(
      sender.items,
      this.unmatchableItems
    );

    for (const receiver of this.receivers) {
      const matchableReceiverItems = difference(
        receiver.items,
        this.unmatchableItems
      );

      if (!hasDifference(matchableSenderItems, matchableReceiverItems)) {
        // Perfect two-way match, we can return immediately
        if (!hasDifference(matchableReceiverItems, matchableSenderItems)) {
          return receiver;
        }

        if (
          bestReceiver === null ||
          bestDiff === null ||
          difference(matchableReceiverItems, matchableSenderItems).size <
            bestDiff.size
        ) {
          bestReceiver = receiver;
          bestDiff = difference(matchableReceiverItems, matchableSenderItems);
        }
      }
    }
    return bestReceiver;
  }

  private createStandDeliveryMatch(sender: MatchableUser) {
    const deliveryItems = intersect(sender.items, this.unmatchableItems);
    if (deliveryItems.size === 0) {
      return;
    }

    sender.items = difference(sender.items, deliveryItems);
    let appendToMatch: StandDeliveryMatch | null = null;
    for (const match of this.matches.values()) {
      if (
        match.type === MatchTypes.StandDeliveryMatch &&
        match.senderId === sender.id
      ) {
        appendToMatch = match;
        break;
      }
    }
    const match: StandDeliveryMatch = {
      senderId: sender.id,
      items: deliveryItems,
      type: MatchTypes.StandDeliveryMatch,
    };
    if (appendToMatch != null) {
      appendToMatch.items = union(appendToMatch.items, deliveryItems);
    } else {
      this.matches.add(match);
    }
  }

  private createStandPickupMatch(receiver: MatchableUser) {
    const items = receiver.items;
    receiver.items = new Set();
    const match: StandPickupMatch = {
      receiverId: receiver.id,
      items,
      type: MatchTypes.StandPickupMatch,
    };
    this.matches.add(match);
  }

  private createFullMatches() {
    const fullyMatchedSenders: Set<MatchableUser> = new Set();
    for (const sender of this.senders) {
      // Match unmatchable items with stand
      this.createStandDeliveryMatch(sender);
      // If all items are unmatchable, the sender is fully matched
      if (sender.items.size === 0) {
        fullyMatchedSenders.add(sender);
        continue;
      }

      const matchedReceiver = this.tryFindFullyMatchingReceiver(sender);
      if (matchedReceiver === null) {
        continue;
      }

      this.matches.add({
        senderId: sender.id,
        receiverId: matchedReceiver.id,
        items: sender.items,
        type: MatchTypes.UserMatch,
      });
      fullyMatchedSenders.add(sender);

      matchedReceiver.items = difference(matchedReceiver.items, sender.items);
    }

    this.senders = difference(this.senders, fullyMatchedSenders);
  }

  private createLargestPartlyMatch(sender: MatchableUser) {
    // TODO: perf optimization: remove receivers which only have unmatchable items
    let bestMatchPair: { match: NewMatch; receiver: MatchableUser } | null =
      null;
    for (const receiver of this.receivers) {
      const matchableReceiverItems = intersect(sender.items, receiver.items);
      if (
        matchableReceiverItems.size > (bestMatchPair?.match.items.size ?? 0)
      ) {
        bestMatchPair = {
          match: {
            senderId: sender.id,
            receiverId: receiver.id,
            items: matchableReceiverItems,
            type: MatchTypes.UserMatch,
          },
          receiver,
        };
        if (bestMatchPair.match.items.size >= sender.items.size - 1) {
          break;
        }
      }
    }

    if (bestMatchPair === null) {
      // No receiver wants ANY of sender's items; those are unmatchable. Refer to stand
      this.unmatchableItems = union(this.unmatchableItems, sender.items);
      this.createStandDeliveryMatch(sender);
    } else {
      bestMatchPair.receiver.items = difference(
        bestMatchPair.receiver.items,
        bestMatchPair.match.items
      );
      sender.items = difference(sender.items, bestMatchPair.match.items);
      this.matches.add(bestMatchPair.match);
    }
  }

  private createPartlyMatches() {
    // possible optimization instead of having Set[], have PriorityQueue[] where each queue
    // prioritizes the senders which already have the most matches, to reduce fragmentation
    const sortedSenderGroups = this.groupUsersByNumberOfItems(this.senders);

    for (const sortedSenderGroup of sortedSenderGroups) {
      for (const sender of sortedSenderGroup) {
        // Match unmatchable items with stand
        this.createStandDeliveryMatch(sender);

        // If all items are unmatchable, the sender is fully matched
        if (sender.items.size === 0) {
          continue;
        }

        this.createLargestPartlyMatch(sender);

        if (sender.items.size > 0) {
          const newGroup =
            sortedSenderGroups[
              sortedSenderGroups.length - 1 - sender.items.size
            ];
          if (newGroup === undefined) {
            throw new Error(
              "SortedSenderGroups should have as many entries as the maximum number of sender items"
            );
          }
          newGroup.add(sender);
        }
      }
    }
  }

  private satisfyReceivers() {
    for (const receiver of this.receivers) {
      if (receiver.items.size > 0) {
        this.createStandPickupMatch(receiver);
      }
    }
  }

  constructor(
    _senders: MatchableUser[],
    _receivers: MatchableUser[],
    outdatedItems: string[]
  ) {
    this.unmatchableItems = new Set(outdatedItems);
    this.receivers = copyUsers(_receivers);
    this.senders = copyUsers(_senders);
  }

  public match() {
    this.createFullMatches();

    this.createPartlyMatches();

    this.satisfyReceivers();

    return this.matches;
  }
}
