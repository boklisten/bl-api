import {
  OrderItem,
  Match,
  MatchItem,
  UserDetail,
  MatchProfile,
  BlError,
} from '@wizardcoder/bl-model';

export class MatchHelper {
  public convertOrderItemsToMatchItems(orderItems: OrderItem[]): MatchItem[] {
    return orderItems.map(orderItem => {
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
    let matchedItems = [];
    let matchItemIds = matchItems.map(matchItem => matchItem.item).sort();

    for (let matchItemId of matchItemIds) {
      for (let mi of match.items) {
        if (mi.item.toString() === matchItemId.toString()) {
          matchedItems.push(mi.item);
        }
      }
    }

    if (!matchedItems || matchedItems.length <= 0) {
      throw new BlError('no items found to be matching in match');
    }

    return matchedItems;
  }

  public findMatchingItemIdsFromPartlyMatched(
    matchItems: MatchItem[],
    match: Match,
  ): string[] {
    let matchedItems = [];
    let matchItemIds = matchItems.map(matchItem => matchItem.item).sort();
    let recievers = [];

    for (let matchItemId of matchItemIds) {
      for (let mi of match.items) {
        if (mi.reciever) {
          if (recievers.indexOf(mi.reciever) < 0) {
            recievers.push(mi.reciever);
          }
        }
        if (mi.item.toString() === matchItemId.toString() && !mi.reciever) {
          matchedItems.push(mi.item);
        }
      }
    }

    if (recievers.length > 1) {
      throw new BlError('match already contains more than one reciever');
    }

    if (!matchedItems || matchedItems.length <= 0) {
      throw new BlError('no items found to be matching in match');
    }

    return matchedItems;
  }
}
