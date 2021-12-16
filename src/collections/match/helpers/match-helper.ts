import {
  OrderItem,
  Match,
  MatchItem,
  UserDetail,
  MatchProfile,
  BlError,
} from "@boklisten/bl-model";

export class MatchHelper {
  public convertOrderItemsToMatchItems(orderItems: OrderItem[]): MatchItem[] {
    return orderItems.map((orderItem) => {
      return {
        item: orderItem.item as string,
        customerItem: orderItem.customerItem as string,
        title: orderItem.title,
      };
    });
  }

  public convertUserDetailToMatchProfile(userDetail: UserDetail): MatchProfile {
    return {
      userId: userDetail.id,
      name: userDetail.name,
      email: userDetail.email,
      phone: userDetail.phone,
    };
  }

  public findMatchingItemIds(matchItems: MatchItem[], match: Match): string[] {
    const matchedItems = [];
    const matchItemIds = matchItems.map((matchItem) => matchItem.item).sort();

    for (const matchItemId of matchItemIds) {
      for (const mi of match.items) {
        if (mi.item.toString() === matchItemId.toString() && !mi.reciever) {
          matchedItems.push(mi.item.toString());
        }
      }
    }

    if (!matchedItems || matchedItems.length <= 0) {
      throw new BlError("no items found to be matching in match");
    }

    return matchedItems;
  }

  public findMatchingItemIdsFromPartlyMatched(
    matchItems: MatchItem[],
    match: Match
  ): string[] {
    const matchedItems = [];
    const matchItemIds = matchItems.map((matchItem) => matchItem.item).sort();
    const recievers = [];

    for (const matchItemId of matchItemIds) {
      for (const mi of match.items) {
        if (mi.reciever) {
          if (recievers.indexOf(mi.reciever.toString()) < 0) {
            recievers.push(mi.reciever.toString());
          }
        }
        if (mi.item.toString() === matchItemId.toString() && !mi.reciever) {
          matchedItems.push(mi.item);
        }
      }
    }

    if (recievers.length > 1) {
      throw new BlError("match already contains more than one reciever");
    }

    if (!matchedItems || matchedItems.length <= 0) {
      throw new BlError("no items found to be matching in match");
    }

    return matchedItems;
  }
}
