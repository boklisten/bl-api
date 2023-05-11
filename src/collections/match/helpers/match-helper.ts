import {
  OrderItem,
  Match,
  MatchItem,
  UserDetail,
  MatchProfile,
  BlError,
  Item,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { itemSchema } from "../../item/item.schema";
import { BlCollectionName } from "../../bl-collection";

export class MatchHelper {
  constructor(private itemStorage?: BlDocumentStorage<Item>) {
    this.itemStorage =
      itemStorage ?? new BlDocumentStorage(BlCollectionName.Items, itemSchema);
  }

  public async convertOrderItemsToMatchItems(
    orderItems: OrderItem[]
  ): Promise<MatchItem[]> {
    const matchItems = [];
    for (const orderItem of orderItems) {
      const item = await this.itemStorage.get(orderItem.item as string);
      matchItems.push({
        item: orderItem.item as string,
        isbn: item.info.isbn,
        customerItem: orderItem.customerItem as string,
        title: orderItem.title,
      });
    }

    return matchItems;
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
