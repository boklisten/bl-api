import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError} from '@wizardcoder/bl-model';

import { MessengerReminder } from './messenger-reminder';
import { BlDocumentStorage } from '../../storage/blDocumentStorage';
import { CustomerItem } from '@wizardcoder/bl-model';
import { SEDbQuery } from '../../query/se.db-query';
import { CustomerItemHandler } from '../../collections/customer-item/helpers/customer-item-handler';

chai.use(chaiAsPromised);

describe('MessengerReminder', () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>('customerItems');
  const customerItemHandler = new CustomerItemHandler();
  const customerItemStorageGetAllStub = sinon.stub(customerItemStorage, 'getAll');
  const customerItemStorageGetByQueryStub = sinon.stub(customerItemStorage, 'getByQuery');
  const messengerReminder = new MessengerReminder(customerItemHandler);
  const getNotReturnedStub = sinon.stub(customerItemHandler, 'getNotReturned');

  describe('#remindCustomer', () => {
    it('should throw error if no customerId is provided', (done) => {
      messengerReminder.remindCustomer(null, new Date()).catch((err) => {
      
        expect(err.getMsg())
          .to.contain('customerId is null or undefined');

        done();
      });
    });

    it('should throw error if deadline is not provided', (done) => {
      messengerReminder.remindCustomer('abc', null).catch((err) => {
        expect(err.getMsg())
          .to.contain('deadline is null or undefined');

        done();
      });
    });

    it('should call customerItemHandler to get not returned customerItems', (done) => {
      getNotReturnedStub.onFirstCall().resolves([]);

      messengerReminder.remindCustomer('customer1', new Date()).then(() => {
        expect(getNotReturnedStub).to.be.calledOnce;
        done();
      });
    });
  });
});
