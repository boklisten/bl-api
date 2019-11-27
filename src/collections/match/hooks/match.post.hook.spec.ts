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
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import * as sinonChai from 'sinon-chai';
import {MatchPostHook} from './match.post.hook';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const customerItemStorage = new BlDocumentStorage<CustomerItem>(
  'customeritems',
);

const matchStorage = new BlDocumentStorage<Match>('matches');

const customerItemGetStub = sinon.stub(customerItemStorage, 'get');

const matchPostHook = new MatchPostHook(customerItemStorage, matchStorage);

describe('#before()', () => {
  it('should reject if Match.sender.userId is not equal to accessToken.details', () => {
    const accessToken = {
      details: 'userDetails1',
    } as AccessToken;

    const match = {
      sender: {
        userId: 'someOtherUserId',
      },
    } as Match;

    return expect(
      matchPostHook.before(match, accessToken),
    ).to.eventually.be.rejectedWith(
      BlError,
      /Match.sender.userId does not match accessToken.details/,
    );
  });

  it('should reject if one of the customerItems already has a match attached', () => {
    const accessToken = {
      details: 'userDetails1',
    } as AccessToken;

    const match = {
      sender: {
        userId: 'userDetails1',
      },
      items: [
        {
          customerItem: 'customerItem1',
        },
        {
          customerItem: 'customerItem2',
        },
      ],
    } as Match;

    customerItemGetStub
      .withArgs('customerItem1')
      .resolves({deadline: new Date()});

    customerItemGetStub.withArgs('customerItem2').resolves({
      deadline: new Date(),
      match: true,
      matchInfo: {time: new Date()},
    });

    return expect(
      matchPostHook.before(match, accessToken),
    ).to.eventually.be.rejectedWith(
      BlError,
      /customerItem "customerItem2" already has a match attached/,
    );
  });

  it('should resolve if match is valid', () => {
    const accessToken = {
      details: 'userDetails1',
    } as AccessToken;

    const match = {
      sender: {
        userId: 'userDetails1',
      },
      items: [
        {
          customerItem: 'customerItem1',
        },
        {
          customerItem: 'customerItem2',
        },
      ],
    } as Match;

    customerItemGetStub
      .withArgs('customerItem1')
      .resolves({deadline: new Date()});

    customerItemGetStub.withArgs('customerItem2').resolves({
      deadline: new Date(),
    });

    return expect(matchPostHook.before(match, accessToken)).to.eventually.be
      .true;
  });
});

describe('#after()', () => {});
