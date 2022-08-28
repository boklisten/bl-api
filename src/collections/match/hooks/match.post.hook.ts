import { Hook } from "../../../hook/hook";
import { CustomerItem, Match, AccessToken, BlError } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { matchSchema } from "../match.schema";
import { customerItemSchema } from "../../customer-item/customer-item.schema";
import { MatchUpdater } from "../helpers/match-updater/match-updater";
import {User} from "../../user/user";

export class MatchPostHook implements Hook {
  constructor(
    private customerItemStorage?: BlDocumentStorage<CustomerItem>,
    private matchStorage?: BlDocumentStorage<Match>,
    private matchUpdater?: MatchUpdater
  ) {
    this.customerItemStorage = customerItemStorage
      ? customerItemStorage
      : new BlDocumentStorage("customeritems", customerItemSchema);
    this.matchStorage = matchStorage
      ? matchStorage
      : new BlDocumentStorage("matches", matchSchema);
    this.matchUpdater = this.matchUpdater
      ? this.matchUpdater
      : new MatchUpdater();
  }

  public async before(
    match: Match,
    accessToken: AccessToken
  ): Promise<boolean> {
    if (match.events[match.events.length - 1].type === "items-sent") {
      await this.matchStorage.update(
          match.id,
          match,
          match.user as User
      );
      throw new BlError("Do not create duplicates")
    }

    if (!match.sender || match.sender.userId !== accessToken.details) {
      throw new BlError(
        `Match.sender.userId does not match accessToken.details`
      );
    }

    for (const item of match.items) {
      const customerItem = await this.customerItemStorage.get(
        item.customerItem
      );
      if (customerItem.match) {
        throw new BlError(
          `customerItem "${item.customerItem}" already has a match attached`
        );
      }
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async after(matches: Match[], accessToken: AccessToken): Promise<any> {
    const match = matches[0];

    for (const item of match.items) {
      try {
        await this.customerItemStorage.update(
          item.customerItem,
          { match: true, matchInfo: { id: match.id, time: new Date() } },
          { id: accessToken.details, permission: accessToken.permission }
        );
      } catch (e) {
        throw new BlError(
          `could not update customerItem "${item.customerItem}" with match data`
        );
      }
    }

    return [match];
  }
}
