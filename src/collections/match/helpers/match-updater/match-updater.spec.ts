import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {
  BlError,
  Match,
  UserDetail,
  OrderItem,
  CustomerItem,
  MatchItem,
  MatchProfile,
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {MatchUpdater} from './match-updater';
import * as sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const matchStorage = new BlDocumentStorage<Match>('matches');
const matchUpdater = new MatchUpdater(matchStorage);
const matchStorageUpdate = sinon.stub(matchStorage, 'update');

describe('update()', () => {
  it('should resolve with updated match with state "fully-matched"', () => {
    let createdEvent = {type: 'created', time: new Date()};

    const match = {
      recievers: [],
      state: 'created',
      events: [createdEvent],
      items: [
        {
          item: 'item1',
        },
      ],
    } as Match;

    const reciever = {
      userId: 'user1',
      name: 'Billy Bobson',
      email: 'billy@boklisten.co',
      phone: '12345678',
    } as MatchProfile;

    const matchedItems = [
      {
        item: 'item1',
      },
    ] as MatchItem[];

    let expectedMatch = {
      state: 'fully-matched',
      recievers: [reciever],
      events: [createdEvent, {type: 'fully-matched', time: new Date()}],
      items: [
        {
          item: 'item1',
          reciever: 'user1',
        },
      ],
    };

    matchStorageUpdate.onFirstCall().resolves(expectedMatch);

    return matchUpdater
      .update(match, reciever, matchedItems)
      .should.eventually.be.deep.equal(expectedMatch);
  });

  it('should resolve with updated match with state "fully-matched" #2', () => {
    let createdEvent = {type: 'created', time: new Date()};

    const match = {
      recievers: [],
      state: 'created',
      events: [createdEvent],
      items: [
        {
          item: 'item1',
        },
        {
          item: 'item2',
          reciever: 'reciever2',
        },
      ],
    } as Match;

    const reciever = {
      userId: 'user1',
      name: 'Billy Bobson',
      email: 'billy@boklisten.co',
      phone: '12345678',
    } as MatchProfile;

    const matchedItems = [
      {
        item: 'item1',
      },
    ] as MatchItem[];

    let expectedMatch = {
      state: 'fully-matched',
      recievers: [reciever],
      events: [createdEvent, {type: 'fully-matched', time: new Date()}],
      items: [
        {
          item: 'item1',
          reciever: 'user1',
        },
        {
          item: 'item2',
          reciever: 'reciever2',
        },
      ],
    };

    matchStorageUpdate.onSecondCall().resolves(expectedMatch);
    return matchUpdater
      .update(match, reciever, matchedItems)
      .should.eventually.be.deep.equal(expectedMatch);
  });

  it('should resolve with updated match with state "partly-matched"', () => {
    let createdEvent = {type: 'created', time: new Date()};

    const match = {
      recievers: [],
      state: 'created',
      events: [createdEvent],
      items: [
        {
          item: 'item1',
        },
        {
          item: 'item2',
        },
      ],
    } as Match;

    const reciever = {
      userId: 'user1',
      name: 'Billy Bobson',
      email: 'billy@boklisten.co',
      phone: '12345678',
    } as MatchProfile;

    const matchedItems = [
      {
        item: 'item1',
      },
    ] as MatchItem[];

    let expectedMatch = {
      state: 'partly-matched',
      recievers: [reciever],
      events: [createdEvent, {type: 'partly-matched', time: new Date()}],
      items: [
        {
          item: 'item1',
          reciever: 'user1',
        },
        {
          item: 'item2',
        },
      ],
    };

    matchStorageUpdate.onThirdCall().resolves(expectedMatch);
    return matchUpdater
      .update(match, reciever, matchedItems)
      .should.eventually.be.deep.equal(expectedMatch);
  });
});
