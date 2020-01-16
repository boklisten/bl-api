import {Match, MatchItem, BlError} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {matchSchema} from '../../match.schema';

// priority list
// 1: full matches with 'created' orders
// 2: full match with 'partly-matched' orders (that is inside matching-window)
// 3: partly-matches with 'created' orders

export class MatchFinder {
  constructor(private matchStorage?: BlDocumentStorage<Match>) {
    this.matchStorage = this.matchStorage
      ? this.matchStorage
      : new BlDocumentStorage<Match>('matches', matchSchema);
  }

  public async find(matchItems: MatchItem[]): Promise<any> {
    let matches = await this.matchStorage.getAll();

    matches = this.filterValidMatches(matches);

    if (!matches || matches.length <= 0) {
      throw new BlError('no match with valid state found');
    }

    try {
      const match = this.searchForFullMatch(matchItems, matches);
      return match;
    } catch (e) {
      throw new BlError('no match was found');
    }
  }
  /*
  private searchForPartlyMatch(
    matchItems: MatchItem[],
    matches: Match[],
  ): Match {
    // find full matches with partly-matched orders
    for (let match of matches) {

    }
    throw 'funcc not implemented';
  }
  */

  private searchForFullMatch(matchItems: MatchItem[], matches: Match[]): Match {
    // check all matches for a match that is a full match
    // meaning all items in the match should be in the provided matchItems

    const matchItemIds = this.extractItemIds(matchItems);

    for (let match of matches) {
      if (match.items.length === matchItems.length) {
        if (matchItemIds == this.extractItemIds(match.items)) {
          return match;
        }
      }
    }

    throw 'func not implemented';
  }

  private filterValidMatches(matches: Match[]) {
    return matches.filter(
      match => match.state === 'created' || match.state === 'partly-matched',
    );
  }
  private extractItemIds(matchItems: MatchItem[]): string {
    return matchItems
      .map(matchItem => matchItem.item)
      .sort()
      .toString();
  }
}
