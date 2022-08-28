import { Match, MatchItem, BlError } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { matchSchema } from "../../match.schema";
import { MatchFinderPartlyMatch } from "./match-finder-partly-match/match-finder-partly-match";

// priority list
// 1: full matches with 'created' orders
// 2: full match with 'partly-matched' orders (that is inside matching-window)
// 3: partly-matches with 'created' orders

export class MatchFinder {
  private matchFinderPartlyMatch: MatchFinderPartlyMatch;

  constructor(private matchStorage?: BlDocumentStorage<Match>) {
    this.matchStorage = this.matchStorage
      ? this.matchStorage
      : new BlDocumentStorage<Match>("matches", matchSchema);
    this.matchFinderPartlyMatch = new MatchFinderPartlyMatch();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async find(matchItems: MatchItem[]): Promise<any> {
    let matches = await this.matchStorage.getAll();

    matches = this.filterValidMatches(matches);

    if (!matches || matches.length <= 0) {
      throw new BlError("no match with valid state found");
    }

    let match;

    try {
      match = this.searchForFullMatch(matchItems, matches);
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (match) {
      return match;
    }

    try {
      match = await this.matchFinderPartlyMatch.find(matchItems, matches);
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (match) {
      return match;
    }

    throw new BlError("no match found");
  }

  private searchForFullMatch(matchItems: MatchItem[], matches: Match[]): Match {
    // check all matches for a match that is a full match
    // meaning all items in the match should be in the provided matchItems

    const matchItemIds = this.extractItemIds(matchItems);

    for (const match of matches) {
      if (match.items.length === matchItems.length) {
        if (matchItemIds == this.extractItemIds(match.items)) {
          return match;
        }
      }
    }

    throw new BlError("could not find full match");
  }

  private filterValidMatches(matches: Match[]) {
    return matches.filter(
      (match) => match.state === "created" || match.state === "partly-matched"
    );
  }
  private extractItemIds(matchItems: MatchItem[]): string {
    return matchItems
      .filter((matchItem) => !matchItem.reciever)
      .map((matchItem) => matchItem.item)
      .sort()
      .toString();
  }
}
