import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import { BlError, UserDetail } from '@wizardcoder/bl-model';
import { MessengerReminder } from './messenger-reminder';
import { BlDocumentStorage } from '../../storage/blDocumentStorage';
import { CustomerItem } from '@wizardcoder/bl-model';
import { SEDbQuery } from '../../query/se.db-query';
import { CustomerItemHandler } from '../../collections/customer-item/helpers/customer-item-handler';
import { EmailService } from '../email/email-service';

chai.use(chaiAsPromised);

describe('MessengerReminder', () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>('customerItems');
  const customerItemHandler = new CustomerItemHandler();
  const customerItemStorageGetAllStub = sinon.stub(customerItemStorage, 'getAll');
  const customerItemStorageGetByQueryStub = sinon.stub(customerItemStorage, 'getByQuery');
  const emailService = new EmailService();
  const emailServiceRemindStub = sinon.stub(emailService, 'remind');
  const getNotReturnedStub = sinon.stub(customerItemHandler, 'getNotReturned');
  const userDetailStorage = new BlDocumentStorage<UserDetail>('userdetails');
  const userDetailStorageGetStub = sinon.stub(userDetailStorage, 'get');

  const messengerReminder = new MessengerReminder(customerItemHandler, userDetailStorage, emailService);

  afterEach(() => {
    customerItemStorageGetAllStub.reset();
    customerItemStorageGetByQueryStub.reset();
    emailServiceRemindStub.reset();
    getNotReturnedStub.reset();
  });

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

    it('should call emailService.remind with correct arguments', (done) => {

      const customerItems = [
        {
          id: 'customerItem1',
          deadline: new Date(2018, 0, 1),
          title: ''
        }
      ];

      const customerDetail: UserDetail = {
        id: 'customer1',
        name: 'albert',
        address: 'Abc 123',
        email: 'some@email.com',
        phone: '123',
        branch: 'branch1',
        postCode: '0123',
        postCity: 'oslo',
        country: 'norway',
        dob: new Date()
      }

      getNotReturnedStub.resolves(customerItems);
      userDetailStorageGetStub.resolves(customerDetail);
      emailServiceRemindStub.resolves(true);

      messengerReminder.remindCustomer('customer1', new Date()).then(() => {

        expect(emailServiceRemindStub)
          .calledWith(customerDetail, customerItems);
        done();

      }).catch((err) => {
        done(err);
      })
    })
  });
});
