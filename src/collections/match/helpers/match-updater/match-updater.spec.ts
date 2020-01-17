import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import * as moment from 'moment-timezone';
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
import {OpeningHourHelper} from '../../../opening-hour/helpers/opening-hour-helper';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const matchStorage = new BlDocumentStorage<Match>('matches');
const matchUpdater = new MatchUpdater(matchStorage);
const openingHourHelper = new OpeningHourHelper();
const matchStorageUpdate = sinon.stub(matchStorage, 'update');
const openingHourHelperNext = sinon.stub(
  openingHourHelper,
  'getNextAvailableOpeningHour',
);

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

    let openingHour = {
      from: moment()
        .add(1, 'day')
        .toDate(),
      to: moment()
        .add(1, 'day')
        .toDate(),
      branch: 'branch1',
    };

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
      meetingPoint: [
        {
          reciever: reciever.userId,
          location: {
            name: 'Metis Oslo',
            description: 'Ved inngangen',
          },
          time: openingHour.from,
        },
      ],
    };

    //matchStorageUpdate.onFirstCall().resolves(expectedMatch);
    openingHourHelperNext.onFirstCall().resolves(openingHour);

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
