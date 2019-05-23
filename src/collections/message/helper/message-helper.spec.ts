import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {
  AccessToken,
  BlError,
  CustomerItem,
  Message,
  UserDetail,
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import * as sinonChai from 'sinon-chai';
import {MessageHelper} from './message-helper';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('MessageHelper', () => {
  const messageStorage = new BlDocumentStorage<Message>('messages');
  const messageHelper = new MessageHelper(messageStorage);

  let messageStorageGetByQueryStub = sinon.stub(messageStorage, 'getByQuery');

  describe('#isAdded', () => {
    it('should throw error if messageStorage.get fails', async () => {
      const message: Message = {
        id: 'abc',
        messageType: 'reminder',
        messageSubtype: 'partly-payment',
        messageMethod: 'all',
        sequenceNumber: 0,
        customerId: 'abc',
      };

      const errorMessage = 'failed to get message';

      messageStorageGetByQueryStub.callsFake(() => {
        return Promise.reject(errorMessage);
      });

      try {
        await messageHelper.isAdded(message);
        throw new Error('should not be valid');
      } catch (e) {
        return expect(e).to.eq(errorMessage);
      }
    });

    it('should return true if type, subtype, sequence, method and customerId is already in storage', async () => {
      const message: Message = {
        id: 'abc',
        messageType: 'reminder',
        messageSubtype: 'partly-payment',
        messageMethod: 'all',
        sequenceNumber: 0,
        customerId: 'abc',
      };

      messageStorageGetByQueryStub.callsFake(() => {
        return Promise.resolve([message]);
      });

      try {
        const isAdded = await messageHelper.isAdded(message);
        return expect(isAdded).to.be.true;
      } catch (e) {
        throw e;
      }
    });

    it('should return false if type, subtype, sequence, method and customerId is not in storage', async () => {
      const message: Message = {
        id: 'abc',
        messageType: 'reminder',
        messageSubtype: 'partly-payment',
        messageMethod: 'all',
        sequenceNumber: 0,
        customerId: 'abc',
      };

      messageStorageGetByQueryStub.callsFake(() => {
        return Promise.reject(new BlError('not found').code(702));
      });

      try {
        const isAdded = await messageHelper.isAdded(message);
        return expect(isAdded).to.be.false;
      } catch (e) {
        throw e;
      }
    });
  });
});
