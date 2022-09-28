import {
  Match,
  MatchItem,
  MatchProfile,
  MatchState,
} from "@boklisten/bl-model";
import { matchSchema } from "../../match.schema";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { OpeningHourHelper } from "../../../opening-hour/helpers/opening-hour-helper";
import { User } from "../../../user/user";
import { Moment } from "moment";
import { CustomerItemActiveBlid } from "../../../customer-item/helpers/customer-item-active-blid";

export class MatchUpdater {
  constructor(
    private matchStorage?: BlDocumentStorage<Match>,
    private openingHourHelper?: OpeningHourHelper,
    private customerItemActiveBlid?: CustomerItemActiveBlid
  ) {
    this.customerItemActiveBlid = customerItemActiveBlid
      ? customerItemActiveBlid
      : new CustomerItemActiveBlid();
    this.matchStorage = this.matchStorage
      ? this.matchStorage
      : new BlDocumentStorage<Match>("matches", matchSchema);

    this.openingHourHelper = this.openingHourHelper
      ? this.openingHourHelper
      : new OpeningHourHelper();
  }

  // updates the provided match
  // checks if there is a opening hour available
  // sets the reciever on each of the provided items
  // inserts reciever in the match.recievers array
  // inserts an event, eiter "fully-matched" or "partly-matched"
  // updates state to be either "fully-matched" or "partly-matched"
  // updates match in storage
  // returns the match
  public async update(
    match: Match,
    reciever: MatchProfile,
    matchedItems: MatchItem[],
    matchTime: Moment
  ): Promise<Match> {
    match.recievers = !match.recievers ? [] : match.recievers;
    match.events = !match.events ? [] : match.events;
    match.recievers.push(reciever);

    this.updateMatchItems(match, reciever.userId, matchedItems);
    match.meetingPoint = [
      {
        location: {
          name: "Arnes stand",
          description:
            "I nærheten av Boklistens stand. Se etter skilt med navnet «Arne Søraas»",
        },
        time: matchTime.toDate(),
        reciever: "",
      },
    ];
    match.state = this.getMatchState(match);
    match.events.push({ type: match.state, time: new Date() });

    return await this.matchStorage.update(match.id, match, match.user as User);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private addMeetingPoint(match: Match): Promise<Match> {
    throw "not implemented";
    //this.openingHourHelper.getNextAvailableOpeningHour();
  }

  private getMatchState(match: Match): MatchState {
    let matchedItemCount = 0;

    for (const matchItem of match.items) {
      if (matchItem.reciever) {
        matchedItemCount += 1;
      }
    }

    if (matchedItemCount === match.items.length) {
      return "fully-matched";
    } else {
      return "partly-matched";
    }
  }

  private updateMatchItems(
    match: Match,
    recieverId: string,
    matchedItems: MatchItem[]
  ) {
    let matchedItemCount = 0;
    for (const mi of match.items) {
      for (const matchedItem of matchedItems) {
        if (
          mi.item.toString() === matchedItem.item.toString() &&
          !mi.reciever
        ) {
          mi.reciever = recieverId;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          matchedItemCount += 0;
        }
      }
    }
  }
}
