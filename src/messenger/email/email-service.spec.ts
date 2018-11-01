import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, UserDetail, CustomerItem, Item} from '@wizardcoder/bl-model';
import { EmailService } from './email-service';
import { EmailHandler } from '@wizardcoder/bl-email';
import { BlDocumentStorage } from '../../storage/blDocumentStorage';

chai.use(chaiAsPromised);

describe('EmailService', () => {

  const emailHandler = new EmailHandler({sendgrid: {apiKey: 'someKey'}});
  const itemStorage = new BlDocumentStorage<Item>('items');
  const emailService = new EmailService(emailHandler, itemStorage);

  const itemStorageGetStub = sinon.stub(itemStorage, 'get');
  const emailHandlerRemindStub = sinon.stub(emailHandler, 'sendReminder');


  describe('#remind', () => {
    it('should call emailHandler.sendReminder', (done) => {
      emailHandlerRemindStub.resolves(true);
      itemStorageGetStub.resolves({id: 'item1', title: 'title'});

      emailService.remind({id: 'abc', email: 'some@email.org'} as UserDetail, [{id: 'customerItem1'}] as CustomerItem[]).then(() => {
        expect(emailHandlerRemindStub).to.have.been.called;
        done();
      });
    });

    it('should reject if customerItem.item does not exist', (done) => {
      itemStorageGetStub.rejects(new BlError('not found'));

      const customerDetail = {id: 'customer1', name: 'Some Name'} as UserDetail;
      const customerItems = [{
        id: 'someId',
        item: 'item1',
        customer: 'customer1',
        deadline: new Date(),
        handout: false,
        returned: false
      }]

      emailService.remind(customerDetail, customerItems).catch((err) => {
        expect(err.getMsg()).to.eq('not found');
        done();
      })
    });


    it('should convert all customerItems as emailOrderItems', (done) => {
      const customerItems = [
        {
          id: '1',
          customer: 'customer1',
          item: 'item1',
          deadline: new Date(2018, 0, 1)
        },
        {
          id: '2',
          customer: 'customer1',
          item: 'item2',
          deadline: new Date(2018, 0, 1)
        }
      ] as CustomerItem[];

      const customerDetail = {
        id: 'customer1',
        name: 'Some Name',
        email: 'some@email.com'
      } as UserDetail;

      const item1 = {
        id: 'item1',
        title: 'Signatur 1'
      }

      const item2 = {
        id: 'item2',
        title: 'Terra Mater'
      }
      
      emailHandlerRemindStub.resolves(true);
      itemStorageGetStub.withArgs('item1').resolves(item1);
      itemStorageGetStub.withArgs('item2').resolves(item2);

      emailService.remind(customerDetail, customerItems).then(() => {
        const emailOrderItems = emailHandlerRemindStub.lastCall.args[1].items;

        expect(emailOrderItems).to.eql([
          {
            title: 'Signatur 1',
            deadline: '01.01.2018'
          },
          {
            title: 'Terra Mater',
            deadline: '01.01.2018'
          }
        ])

        done();

      }).catch((err) => {
        done(err);
      })
    })
  })

});
