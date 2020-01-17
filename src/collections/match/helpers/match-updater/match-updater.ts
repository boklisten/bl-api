import {
  Match,
  MatchProfile,
  MatchItem,
  MatchState,
} from '@wizardcoder/bl-model';
import {matchSchema} from '../../match.schema';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';

export class MatchUpdater {
  constructor(private matchStorage?: BlDocumentStorage<Match>) {
    this.matchStorage = this.matchStorage
      ? this.matchStorage
      : new BlDocumentStorage<Match>('matches', matchSchema);
  }

  // updates the provided match
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
  ): Promise<Match> {
    match.recievers = !match.recievers ? [] : match.recievers;
    match.events = !match.events ? [] : match.events;
    match.recievers.push(reciever);

    this.updateMatchItems(match, reciever.userId, matchedItems);

    match.state = this.getMatchState(match);
    match.events.push({type: match.state, time: new Date()});

    let updatedMatch = await this.matchStorage.update(match.id, match, {
      id: 'SYSTEM',
      permission: 'super',
    });

    return updatedMatch;
  }

  private getMatchState(match: Match): MatchState {
    let matchedItemCount = 0;

    for (let matchItem of match.items) {
      if (matchItem.reciever) {
        matchedItemCount += 1;
      }
    }

    if (matchedItemCount === match.items.length) {
      return 'fully-matched';
    } else {
      return 'partly-matched';
    }
  }

  private updateMatchItems(
    match: Match,
    recieverId: string,
    matchedItems: MatchItem[],
  ) {
    let matchedItemCount = 0;
    for (let mi of match.items) {
      for (let matchedItem of matchedItems) {
        if (
          mi.item.toString() === matchedItem.item.toString() &&
          !mi.reciever
        ) {
          mi.reciever = recieverId;
          matchedItemCount += 0;
        }
      }
    }
  }
}
