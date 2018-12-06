import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
chai.use(chaiAsPromised);
import {BlErrorHandler} from './bl-error-handler';
import {BlDocumentStorage} from '../storage/blDocumentStorage';
import {BlError} from '@wizardcoder/bl-model';
import {BlErrorLog} from '../collections/bl-error-log/bl-error-log';

describe('BlErrorHandler', () => {
  const errorLogStorage = new BlDocumentStorage<BlErrorLog>('');
  const blErrorHandler = new BlErrorHandler(errorLogStorage);

  const errorLogStorageAddSpy = sinon.stub(errorLogStorage, 'add');

  afterEach(() => {
    errorLogStorageAddSpy.reset();
  });

  describe('#storeError', () => {
    it('should store error', () => {
      const blError = new BlError('some error');
      const expectedStoredErrorLog = new BlErrorLog(blError);

      errorLogStorageAddSpy.resolves(true);

      blErrorHandler.storeError(blError);

      return expect(errorLogStorageAddSpy.lastCall.args[0]).to.eql(
        expectedStoredErrorLog,
      );
    });

    it('should store error including error stack', () => {
      const blError = new BlError('some error');
      blError.add(new BlError('another error').code(700));

      const expectedStoredErrorLog = new BlErrorLog(blError);

      errorLogStorageAddSpy.resolves(true);

      blErrorHandler.storeError(blError);

      let errorLog = errorLogStorageAddSpy.lastCall.args[0];

      return expect(errorLog.errorStack).to.eql(blError.errorStack);
    });

    it('should store error including error store', () => {
      const blError = new BlError('some error');
      blError.store('randomObj', {title: 'hi', age: 10});

      const expectedStoredErrorLog = new BlErrorLog(blError);

      errorLogStorageAddSpy.resolves(true);

      blErrorHandler.storeError(blError);

      let errorLog = errorLogStorageAddSpy.lastCall.args[0];

      return expect(errorLog.store[0].value.age).to.eql(10);
    });
  });
});
