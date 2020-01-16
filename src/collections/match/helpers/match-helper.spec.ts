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
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import * as sinonChai from 'sinon-chai';
import {MatchHelper} from './match-helper';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const customerItemStorage = new BlDocumentStorage<CustomerItem>(
  'customeritems',
);

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

describe('#findMatchingItemIds()', () => {
  it('should return all items that are provided in match items #1', done => {
    const matchItems = [
      {
        item: 'item1',
      },
      {
        item: 'item2',
      },
      {
        item: 'item5',
      },
    ] as MatchItem[];

    const match = {
      items: [
        {
          item: 'item1',
        },
        {
          item: 'item3',
        },
        {
          item: 'item4',
        },
        {
          item: 'item2',
        },
      ],
    } as Match;

    expect(matchHelper.findMatchingItemIds(matchItems, match)).to.have.members([
      match.items[0].item,
      match.items[3].item,
    ]);

    done();
  });

  it('should return all items that matches the provided match items #2', done => {
    const matchItems = [
      {
        item: 'item1',
      },
      {
        item: 'item2',
      },
      {
        item: 'item5',
      },
    ] as MatchItem[];

    const match = {
      items: [
        {
          item: 'item4',
        },
        {
          item: 'item5',
        },
        {
          item: 'item6',
        },
        {
          item: 'item7',
        },
      ],
    } as Match;

    expect(matchHelper.findMatchingItemIds(matchItems, match)).to.have.members([
      match.items[1].item,
    ]);

    done();
  });

  it('should return all items that matches the provided match items #3', done => {
    const matchItems = [
      {
        item: 'item1',
      },
      {
        item: 'item2',
      },
      {
        item: 'item5',
      },
    ] as MatchItem[];

    const matches = [
      {
        items: [
          {
            item: 'item4',
          },
          {
            item: 'item5',
          },
          {
            item: 'item6',
          },
          {
            item: 'item7',
          },
        ],
      },
      {
        items: [{item: 'item6'}, {item: 'item5'}],
      },
    ] as Match[];

    for (let match of matches) {
      expect(
        matchHelper.findMatchingItemIds(matchItems, match),
      ).to.have.members([match.items[1].item]);
    }

    done();
  });

  it('should throw error if none of the provided items are in match', done => {
    const matchItems = [
      {
        item: 'item1',
      },
      {
        item: 'item2',
      },
    ] as MatchItem[];

    const match = {
      items: [
        {
          item: 'item4',
        },
        {
          item: 'item5',
        },
        {
          item: 'item6',
        },
      ],
    } as Match;

    expect(() => {
      matchHelper.findMatchingItemIds(matchItems, match);
    }).throws(BlError, /no items found to be matching in match/);

    done();
  });

  describe('#findMatchingItemIdsFromPartlyMatched()', () => {
    it('should only return items that does not have matching items with a reciever', done => {
      const matchItems = [
        {
          item: 'item1',
        },
        {
          item: 'item2',
        },
        {
          item: 'item3',
        },
        {
          item: 'item4',
        },
      ] as MatchItem[];

      const match = {
        items: [
          {
            item: 'item1',
            reciever: 'reciever1',
          },
          {
            item: 'item2',
          },
          {
            item: 'item3',
            reciever: 'reciever1',
          },
          {
            item: 'item4',
          },
        ],
      } as Match;

      expect(
        matchHelper.findMatchingItemIdsFromPartlyMatched(matchItems, match),
      ).to.have.members([match.items[1].item, match.items[3].item]);

      done();
    });

    it('should reject if there are already more than one reciever on match', done => {
      const matchItems = [
        {
          item: 'item1',
        },
        {
          item: 'item2',
        },
        {
          item: 'item3',
        },
        {
          item: 'item4',
        },
      ] as MatchItem[];

      const match = {
        items: [
          {
            item: 'item1',
            reciever: 'reciever1',
          },
          {
            item: 'item2',
            reciever: 'reciever3',
          },
          {
            item: 'item3',
            reciever: 'reciever2',
          },
          {
            item: 'item4',
          },
        ],
      } as Match;

      expect(() => {
        matchHelper.findMatchingItemIdsFromPartlyMatched(matchItems, match);
      }).throws(BlError, /match already contains more than one reciever/);

      done();
    });
  });
});
