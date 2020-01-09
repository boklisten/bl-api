import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {
  AccessToken,
  BlError,
  Match,
  CustomerItem,
  Message,
  UserDetail,
  OrderItem,
  MatchItem,
  MatchProfile,
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import * as sinonChai from 'sinon-chai';
import {MatchHelper} from './match-helper';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const customerItemStorage = new BlDocumentStorage<CustomerItem>(
  'customeritems',
);

const matchStorage = new BlDocumentStorage<Match>('matches');

const customerItemGetStub = sinon.stub(customerItemStorage, 'get');
const customerItemUpdateStub = sinon.stub(customerItemStorage, 'update');

const matchHelper = new MatchHelper();

describe('#convertOrderItemsToMatchItems()', () => {
  it('should convert order items to match items', done => {
    const orderItems: OrderItem[] = [
      {
        type: 'partly-payment',
        item: 'item1',
        customerItem: '',
        title: 'test item one',
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
      },
    ];

    const matchItems: MatchItem[] = matchHelper.convertOrderItemsToMatchItems(
      orderItems,
    );

    const matchItem = matchItems[0];

    expect(matchItem.item, 'item1');
    expect(matchItem.customerItem, 'customerItem1');
    expect(matchItem.title, 'test item one');
    done();
  });
});

describe('#convertUserDetailToMatchProfile()', () => {
  it('should convert user detail to match profile', done => {
    const userDetail = {
      id: 'user1',
      name: 'Albert Birgerson',
      email: 'abirger@boklisten.co',
      phone: '12345678',
    } as UserDetail;

    const matchProfile = matchHelper.convertUserDetailToMatchProfile(
      userDetail,
    );

    expect(matchProfile.name, 'Albert Birgerson');
    expect(matchProfile.email, 'abirger@boklisten.co');
    expect(matchProfile.phone, '12345678');
    expect(matchProfile.userId, 'user1');
    done();
  });
});
