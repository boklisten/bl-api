import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Message} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {BlApiRequest} from '../../../request/bl-api-request';
import {SEResponseHandler} from '../../../response/se.response.handler';
import {TwilioSmsEventOperation} from './twillio-sms-event.operation';

chai.use(chaiAsPromised);

describe('TwilioSmsEventOperation', () => {
  const messageStorage = new BlDocumentStorage<Message>('messages');

  const twilioSmsEventOperation = new TwilioSmsEventOperation(messageStorage);

  let messageStorageGetIdStub = sinon.stub(messageStorage, 'get');
  let messageStorageUpdateStub = sinon.stub(messageStorage, 'update');

  messageStorageUpdateStub.resolves(true);

  describe('#run', () => {
    it('should be rejected if blApiRequest.data is empty or undefined', () => {
      const blApiRequest = {
        data: null,
      };

      return expect(twilioSmsEventOperation.run(blApiRequest)).to.be.rejected;
    });

    it('should be rejected if blApiRequest.query is empty or undefined', () => {
      const blApiRequest = {
        data: {
          status: 'sent',
          price: -0.0075,
          price_unit: 'USD',
          body: 'some message',
        },
        query: null,
      };

      return expect(twilioSmsEventOperation.run(blApiRequest)).to.be.rejected;
    });

    it('should get correct message based on query parameter', done => {
      const twilioSmsEvent = {
        status: 'sent',
        price: -0.0075,
        price_unit: 'USD',
        body: 'some message',
      };

      const blApiRequest = {
        data: twilioSmsEvent,
        query: {bl_message_id: 'blMessage1'},
      };

      messageStorageUpdateStub.resolves(true);

      messageStorageGetIdStub
        .withArgs('blMessage1')
        .resolves({id: 'blMessage1'});

      twilioSmsEventOperation
        .run(blApiRequest)
        .then(() => {
          let arg = messageStorageGetIdStub.lastCall.args[0];

          expect(arg).to.eq('blMessage1');

          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('should update correct message with sendgrid event', done => {
      const twilioSmsEvent = {
        status: 'sent',
        price: -0.0075,
        price_unit: 'USD',
        body: 'some message',
      };

      const blApiRequest = {
        data: [twilioSmsEvent],
        query: {bl_message_id: 'blMessage1'},
      };

      messageStorageGetIdStub
        .withArgs('blMessage1')
        .resolves({id: 'blMessage1'});

      messageStorageUpdateStub.resolves(true);

      twilioSmsEventOperation
        .run(blApiRequest)
        .then(() => {
          let args = messageStorageUpdateStub.lastCall.args;
          expect(args[0]).to.eq('blMessage1');
          expect(args[1]).to.eql({smsEvents: [twilioSmsEvent]});

          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
