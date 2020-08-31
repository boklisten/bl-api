import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
chai.use(chaiAsPromised);
import * as sinon from 'sinon';
import {SEResponseHandler} from '../../../../response/se.response.handler';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {OrderToCustomerItemGenerator} from '../../../customer-item/helpers/order-to-customer-item-generator';
import {Order, BlError} from '@wizardcoder/bl-model';
import {OrderConfirmOperation} from './order-confirm.operation';
import {OrderValidator} from '../../helpers/order-validator/order-validator';
import {OrderPlacedHandler} from '../../helpers/order-placed-handler/order-placed-handler';

describe('OrderConfirmOperation', () => {
  const resHandler = new SEResponseHandler();
  const orderStorage = new BlDocumentStorage<Order>('orders');
  const orderValidator = new OrderValidator();
  const orderPlacedHandler = new OrderPlacedHandler();

  const orderGetStub = sinon.stub(orderStorage, 'get');
  const orderValidateStub = sinon.stub(orderValidator, 'validate');
  const orderPlaceStub = sinon.stub(orderPlacedHandler, 'placeOrder');

  const orderConfirmOperation = new OrderConfirmOperation(
    resHandler,
    orderStorage,
    orderValidator,
    orderPlacedHandler,
  );

  beforeEach(() => {
    orderGetStub.reset();
    orderValidateStub.reset();
  });

  describe('run()', () => {
    it('should reject if order is not found', () => {
      orderGetStub.rejects(new BlError('not found').code(702));

      return expect(
        orderConfirmOperation.run({
          documentId: 'order1',
          user: {id: 'user1', permission: 'customer'},
        }),
      ).to.eventually.be.rejectedWith(BlError, /order "order1" not found/);
    });

    it('should reject if orderPlacedHandler.placeOrder rejects', () => {
      orderGetStub.resolves({id: 'order1'});
      orderPlaceStub.rejects(new BlError('order could not be placed'));

      return expect(
        orderConfirmOperation.run({
          documentId: 'order1',
          user: {id: 'user1', permission: 'customer'},
        }),
      ).to.eventually.be.rejectedWith(BlError, /order could not be placed/);
    });

    it('should resolve if order is placed', () => {
      orderGetStub.resolves({id: 'order1'});
      orderPlaceStub.resolves(true);

      return expect(
        orderConfirmOperation.run({
          documentId: 'order1',
          user: {id: 'user1', permission: 'customer'},
        }),
      ).to.eventually.be.true;
    });
  });
});
