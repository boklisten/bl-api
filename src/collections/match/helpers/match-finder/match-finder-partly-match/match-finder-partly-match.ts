import { Match, MatchItem, BlError } from "@boklisten/bl-model";
import { MatchHelper } from "../../match-helper";

export class MatchFinderPartlyMatch {
  private matchHelper: MatchHelper;

  constructor() {
    this.matchHelper = new MatchHelper();
  }

  // first check for matches with state "created"
  //  - for each of them check for the match with the most amount of items matching
  //
  // If no partly-match is found in 'created' check matches with state 'partly-matched':
  //  - for each match, check for possible "full-match"
  //  - for each match, check if there is only ONE reciever, if more then dismiss
  public async find(matchItems: MatchItem[], matches: Match[]): Promise<Match> {
    try {
      const matchInTypeCreated = await this.findPartlyMatchInStateCreated(
        matchItems,
        matches
      );

      if (matchInTypeCreated) {
        return matchInTypeCreated;
      }
    } catch (e) {}

    try {
      const matchInTypePartlyMatched =
        await this.findPartlyMatchInStatePartlyMatched(matchItems, matches);

      if (matchInTypePartlyMatched) {
        return matchInTypePartlyMatched;
      }
    } catch (e) {}

    throw new BlError("no match was found");
  }

  private async findPartlyMatchInStatePartlyMatched(
    matchItems: MatchItem[],
    matches: Match[]
  ): Promise<Match> {
    const matchesWithPartlyMatchedState = matches.filter(
      (match) => match.state === "partly-matched"
    );

    let matchWithMostMatchedItems = null;
    let matchedItemsCount = 0;

    for (const match of matchesWithPartlyMatchedState) {
      let matchedItemIds = [];
      try {
        matchedItemIds = this.matchHelper.findMatchingItemIdsFromPartlyMatched(
          matchItems,
          match
        );
      } catch (e) {
        continue;
      }

      if (matchedItemsCount < matchedItemIds.length) {
        matchWithMostMatchedItems = match;
        matchedItemsCount = matchedItemIds.length;
      }
    }

    if (matchedItemsCount > 0) {
      return matchWithMostMatchedItems;
    }
    return undefined;
  }

  private async findPartlyMatchInStateCreated(
    matchItems: MatchItem[],
    matches: Match[]
  ): Promise<Match> {
    const matchesWithCreatedState = matches.filter(
      (match) => match.state === "created"
    );

    let matchWithMostMatchedItems = null;
    let matchedItemsCount = 0;

    for (const match of matchesWithCreatedState) {
      let matchedItemIds = [];
      try {
        matchedItemIds = this.matchHelper.findMatchingItemIds(
          matchItems,
          match
        );
      } catch (e) {
        continue;
      }

      if (matchedItemsCount < matchedItemIds.length) {
        matchWithMostMatchedItems = match;
        matchedItemsCount = matchedItemIds.length;
      }
    }

    if (matchedItemsCount > 0) {
      return matchWithMostMatchedItems;
    }
    return undefined;
  }
}
