import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import * as moment from 'moment-timezone';
import {BlError, Match, MatchItem, MatchProfile} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import * as sinonChai from 'sinon-chai';
import {dateService} from '../../../../blc/date.service';
import {MatchFinder} from './match-finder';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const matchStorage = new BlDocumentStorage<Match>('matches');
const matchGetAllStub = sinon.stub(matchStorage, 'getAll');
const matchFinder = new MatchFinder(matchStorage);

//const deliveryStorage = new BlDocumentStorage<Delivery>('deliveries');
//const matcher = new Matcher(deliveryStorage);
//const deliveryGetStub = sinon.stub(deliveryStorage, 'get');

describe('find()', () => {
  it('should reject if no match is found', () => {
    const matches = [
      {
        state: 'created',
        items: [
          {
            item: 'abc1',
          },
        ],
      },
    ] as Match[];

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{item: 'someItem'}] as MatchItem[];

    return expect(matchFinder.find(matchItems)).to.eventually.be.rejectedWith(
      BlError,
      /no match was found/,
    );
  });

  it('should reject if no match is found to be of type "created" or "partly-matched"', () => {
    const matches = [
      {
        state: 'done',
        items: [
          {
            item: 'abc1',
          },
        ],
      },
    ] as Match[];

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{item: 'abc1'}] as MatchItem[];

    return expect(matchFinder.find(matchItems)).to.eventually.be.rejectedWith(
      BlError,
      /no match with valid state found/,
    );
  });

  it('should resolve with a match if match is found', () => {
    const matches = [
      {
        state: 'created',
        items: [
          {
            item: 'item1',
          },
        ],
      },
    ] as Match[];

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{item: 'item1'}] as MatchItem[];

    return expect(matchFinder.find(matchItems)).to.eventually.be.fulfilled;
  });
});
