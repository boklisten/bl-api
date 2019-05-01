import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Message} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {BlApiRequest} from '../../../request/bl-api-request';
import {SEResponseHandler} from '../../../response/se.response.handler';
import {SendgridEventOperation} from './sendgrid-event.operation';

chai.use(chaiAsPromised);

describe('SendgridEventOperation', () => {
  const messageStorage = new BlDocumentStorage<Message>('messages');

  const sendgridEventOperation = new SendgridEventOperation(messageStorage);

  let messageStorageGetIdStub = sinon.stub(messageStorage, 'get');
  let messageStorageUpdateStub = sinon.stub(messageStorage, 'update');

  messageStorageUpdateStub.resolves(true);

  describe('#run', () => {
    it('should be rejected if blApiRequest.data is empty or undefined', () => {
      const blApiRequest = {
        data: null,
      };

      return expect(sendgridEventOperation.run(blApiRequest)).to.be.rejected;
    });

    it('should be rejected if blApiRequest.data is not an array', () => {
      const blApiRequest = {
        data: {something: 'else'},
      };

      return expect(sendgridEventOperation.run(blApiRequest)).to.be.rejected;
    });

    it('should return true if sendgridEvent email type is not "reminder"', () => {
      const blApiRequest = {
        data: [
          {
            unique_args: {
              type: 'receipt',
            },
          },
        ],
      };

      return expect(sendgridEventOperation.run(blApiRequest)).to.eventually.be
        .fulfilled;
    });

    it('should get correct message based on info in sendgrid event', done => {
      const sendgridEvent = {
        email: 'some@email.com',
        timestamp: 1234,
        'smtp-id': '<abc>',
        event: 'bounce',
        category: 'reminder',
        sg_event_id: 'abcde',
        sg_message_id: '1234',
        unique_args: {
          message_id: 'blMessage1',
          type: 'reminder',
        },
      };

      const blApiRequest = {data: [sendgridEvent]};

      messageStorageUpdateStub.resolves(true);

      messageStorageGetIdStub
        .withArgs('blMessage1')
        .resolves({id: 'blMessage1'});

      sendgridEventOperation
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
      const sendgridEvent = {
        email: 'some@email.com',
        timestamp: 1234,
        'smtp-id': '<abc>',
        event: 'bounce',
        category: 'reminder',
        sg_event_id: 'abcde',
        sg_message_id: '1234',
        unique_args: {
          message_id: 'blMessage1',
          type: 'reminder',
        },
      };

      const blApiRequest = {data: [sendgridEvent]};

      messageStorageGetIdStub
        .withArgs('blMessage1')
        .resolves({id: 'blMessage1'});

      messageStorageUpdateStub.resolves(true);

      sendgridEventOperation
        .run(blApiRequest)
        .then(() => {
          let args = messageStorageUpdateStub.lastCall.args;

          expect(args[0]).to.eq('blMessage1');
          expect(args[1]).to.eql({events: [sendgridEvent]});

          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
