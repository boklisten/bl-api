import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import * as moment from 'moment-timezone';
import {
  AccessToken,
  BlError,
  Match,
  CustomerItem,
  Message,
  UserDetail,
  OrderItem,
  MatchItem,
  Order,
  Delivery,
  MatchProfile,
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import * as sinonChai from 'sinon-chai';
import {Matcher} from './matcher';
import {dateService} from '../../../../blc/date.service';
import {MatchHelper} from '../match-helper';
import {MatchFinder} from '../match-finder/match-finder';
import {MatchUpdater} from '../match-updater/match-updater';

chai.use(chaiAsPromised);
chai.use(sinonChai);

//const customerItemStorage = new BlDocumentStorage<CustomerItem>(
//'customeritems',
/*);*/

//const matchStorage = new BlDocumentStorage<Match>('matches');
//const customerItemGetStub = sinon.stub(customerItemStorage, 'get');
//
const deliveryStorage = new BlDocumentStorage<Delivery>('deliveries');
const matchFinder = new MatchFinder();
const matchUpdater = new MatchUpdater();
const matcher = new Matcher(deliveryStorage, matchFinder, matchUpdater);

const matchFinderFindStub = sinon.stub(matchFinder, 'find');
const deliveryGetStub = sinon.stub(deliveryStorage, 'get');
const matchUpdaterUpdate = sinon.stub(matchUpdater, 'update');

describe('#match()', () => {
  it('should reject if order is not for correct branch', () => {
    const order = {
      branch: 'someOtherBranch',
    } as Order;

    const userDetail = {} as UserDetail;

    return matcher.match(order, userDetail).should.be.rejected;
  });

  it('should reject if payment is not present', () => {
    const order = {
      branch: '5db00e6bcbfeed32123184c3',
      payments: [],
    } as Order;

    const userDetail = {} as UserDetail;

    return matcher
      .match(order, userDetail)
      .should.be.rejectedWith(BlError, /payment is not present on order/);
  });

  it('should reject if delivery is not of type branch', () => {
    deliveryGetStub.withArgs('delivery1').resolves({
      method: 'bring',
    });

    const order = {
      delivery: 'delivery1',
      branch: '5db00e6bcbfeed32123184c3',
      payments: ['payment1'],
    } as Order;

    const userDetail = {} as UserDetail;

    return matcher
      .match(order, userDetail)
      .should.be.rejectedWith(
        BlError,
        /delivery does not have method "branch"/,
      );
  });

  it('should reject if order time is after 20:00', () => {
    deliveryGetStub.withArgs('delivery2').resolves({
      method: 'branch',
    });

    const order = {
      delivery: 'delivery2',
      branch: '5db00e6bcbfeed32123184c3',
      payments: ['payment1'],
      creationTime: moment()
        .hour(22)
        .minutes(11)
        .seconds(10)
        .toDate(),
    } as Order;

    const userDetail = {} as UserDetail;

    return matcher
      .match(order, userDetail)
      .should.be.rejectedWith(
        BlError,
        /order.creationTime is not in time for the matching-window/,
      );
  });

  it('should resolve if a match is found', () => {
    //matchFinderFindStub.withArgs([{item: 'item2'}]).rejects(new BlError('no match found'));
    let match = {
      state: 'created',
      items: [{item: 'item3'}],
    };
    matchFinderFindStub
      .withArgs([
        {item: 'item3', customerItem: 'customerItem3', title: 'Signatur 4'},
      ])
      .resolves(match);

    deliveryGetStub.withArgs('delivery3').resolves({
      method: 'branch',
    });

    const order = {
      delivery: 'delivery3',
      branch: '5db00e6bcbfeed32123184c3',
      payments: ['payment1'],
      orderItems: [
        {
          item: 'item3',
          customerItem: 'customerItem3',
          title: 'Signatur 4',
        },
      ],
      creationTime: moment()
        .hour(11)
        .minutes(0)
        .seconds(0)
        .toDate(),
    } as any;

    const userDetail = {} as UserDetail;

    matchUpdaterUpdate.reset();
    matchUpdaterUpdate.onFirstCall().resolves({});

    return matcher.match(order, userDetail).should.eventually.be.true;
  });
});
