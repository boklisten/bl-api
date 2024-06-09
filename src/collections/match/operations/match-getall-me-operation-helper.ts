import {
  BlError,
  CustomerItem,
  Item,
  Match,
  MatchRelevantItemDetails,
  MatchRelevantUserDetails,
  MatchVariant,
  MatchWithDetails,
  StandMatch,
  UserDetail,
  UserMatch,
} from "@boklisten/bl-model";

import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { CustomerItemActiveBlid } from "../../customer-item/helpers/customer-item-active-blid";

function selectMatchRelevantUserDetails({
  name,
  phone,
}: UserDetail): MatchRelevantUserDetails {
  return {
    name,
    phone,
  };
}

function mapBlIdsToItemIds(
  blIds: string[],
  customerItemsMap: Map<string, CustomerItem>,
): { [customerItemId: string]: string } {
  return Object.fromEntries(
    blIds.map(String).map((customerItemId) => {
      const customerItem = customerItemsMap.get(customerItemId);
      if (customerItem === undefined) {
        throw new BlError(`No customerItem with id ${customerItemId} found`);
      }
      return [customerItemId, String(customerItem.item)];
    }),
  );
}

function mapItemIdsToItemDetails(
  itemIds: string[],
  itemsMap: Map<string, Item>,
): { [itemId: string]: MatchRelevantItemDetails } {
  return Object.fromEntries(
    Array.from(new Set(itemIds.map(String))).map((itemId) => {
      const item = itemsMap.get(itemId);
      if (item === undefined) {
        throw new BlError(
          `No item found with id ${itemId} when detailing match`,
        );
      }
      const details: MatchRelevantItemDetails = {
        id: itemId,
        title: item.title,
      };
      return [itemId, details];
    }),
  );
}

function addDetailsToMatch(
  match: Match,
  detailsMap: Map<string, UserDetail>,
  customerItemsMap: Map<string, CustomerItem>,
  itemsMap: Map<string, Item>,
): MatchWithDetails {
  if (match._variant === MatchVariant.StandMatch) {
    return {
      ...(JSON.parse(JSON.stringify(match)) as StandMatch),
      itemDetails: mapItemIdsToItemDetails(
        [
          ...match.expectedHandoffItems,
          ...match.expectedPickupItems,
          ...match.receivedItems,
          ...match.deliveredItems,
        ],
        itemsMap,
      ),
    };
  }
  const senderDetails = detailsMap.get(match.sender);
  const receiverDetails = detailsMap.get(match.receiver);

  return {
    ...(JSON.parse(JSON.stringify(match)) as UserMatch),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    senderDetails: selectMatchRelevantUserDetails(senderDetails),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    receiverDetails: selectMatchRelevantUserDetails(receiverDetails),
    blIdToItemMap: mapBlIdsToItemIds(
      [...match.receivedBlIds, ...match.deliveredBlIds],
      customerItemsMap,
    ),
    itemDetails: mapItemIdsToItemDetails(match.expectedItems, itemsMap),
  };
}

export async function addDetailsToAllMatches(
  matches: Match[],
  userDetailStorage: BlDocumentStorage<UserDetail>,
  itemStorage: BlDocumentStorage<Item>,
  customerItemStorage: BlDocumentStorage<CustomerItem>,
): Promise<MatchWithDetails[]> {
  const userIds = Array.from(
    matches.reduce(
      (userIds, match) =>
        match._variant === MatchVariant.UserMatch
          ? new Set([...userIds, match.sender, match.receiver])
          : new Set([...userIds, match.customer]),
      new Set<string>(),
    ),
  );
  const userDetailsMap = new Map(
    await Promise.all(
      userIds.map((id) =>
        userDetailStorage
          .get(id)
          .then((detail): [string, UserDetail] => [id, detail]),
      ),
    ),
  );

  const blIdsToMap = Array.from(
    matches.reduce(
      (blIds, match) =>
        match._variant === MatchVariant.UserMatch
          ? new Set([...blIds, ...match.receivedBlIds, ...match.deliveredBlIds])
          : blIds,
      new Set<string>(),
    ),
  );
  const itemsToMapFromExpectedItems = Array.from(
    matches.reduce(
      (items, match) =>
        match._variant === MatchVariant.UserMatch
          ? new Set([...items, ...match.expectedItems.map(String)])
          : new Set([
              ...items,
              ...match.expectedHandoffItems.map(String),
              ...match.expectedPickupItems.map(String),
            ]),
      new Set<string>(),
    ),
  );
  const blIdsToCustomerItemMap = new Map(
    await Promise.all(
      blIdsToMap.map((blId) =>
        new CustomerItemActiveBlid(customerItemStorage)
          .getActiveCustomerItems(blId)
          .then((customerItems): [string, CustomerItem] => [
            blId,
            // There should never be more than one active customerItem related to a blId
            customerItems[0]!,
          ]),
      ),
    ),
  );
  const itemsToMapFromCustomerItems = Array.from(
    Array.from(blIdsToCustomerItemMap.values()).reduce(
      (itemIds, customerItem) =>
        new Set([...itemIds, String(customerItem.item)]),
      new Set<string>(),
    ),
  );
  const itemsToMap = Array.from(
    new Set([...itemsToMapFromExpectedItems, ...itemsToMapFromCustomerItems]),
  );
  const itemsMap = new Map(
    (await itemStorage.getMany(itemsToMap)).map((item) => [
      String(item.id),
      item,
    ]),
  );

  return matches.map((match) =>
    addDetailsToMatch(match, userDetailsMap, blIdsToCustomerItemMap, itemsMap),
  );
}
