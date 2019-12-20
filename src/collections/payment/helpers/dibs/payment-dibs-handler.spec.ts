import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {
  AccessToken,
  BlError,
  Delivery,
  Order,
  Payment,
  UserDetail,
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {DibsPaymentService} from '../../../../payment/dibs/dibs-payment.service';
import {DibsEasyOrder} from '../../../../payment/dibs/dibs-easy-order/dibs-easy-order';
import {PaymentDibsHandler} from './payment-dibs-handler';

chai.use(chaiAsPromised);

describe('PaymentDibsHandler', () => {
  const orderStorage = new BlDocumentStorage<Order>('orders');
  const paymentStorage = new BlDocumentStorage<Payment>('payments');
  const dibsPaymentService = new DibsPaymentService();
  const deliveryStorage = new BlDocumentStorage<Delivery>('deliveries');
  const userDetailStorage = new BlDocumentStorage<UserDetail>('userDetails');

  const paymentDibsHandler = new PaymentDibsHandler(
    paymentStorage,
    orderStorage,
    dibsPaymentService,
    deliveryStorage,
    userDetailStorage,
  );

  describe('handleDibsPayment()', () => {
    let testOrder: Order;
    let testPayment: Payment;
    let paymentUpdated: boolean;
    let getPaymentIdConfirm: boolean;
    let testAccessToken: AccessToken;
    let testDibsEasyOrder: DibsEasyOrder;
    let getDibsEasyOrderConfirm: boolean;
    let testPaymentId: string;
    let orderUpdated: boolean;
    let testDelivery: Delivery;

    beforeEach(() => {
      testOrder = {
        id: 'order1',
        amount: 200,
        orderItems: [],
        branch: 'branch1',
        customer: 'customer1',
        byCustomer: true,
      };

      testPayment = {
        id: 'payment1',
        method: 'dibs',
        order: 'order1',
        amount: 200,
        customer: 'customer1',
        branch: 'branch1',
      };

      testAccessToken = {
        iss: '',
        aud: '',
        iat: 0,
        exp: 0,
        sub: 'user1',
        username: '',
        permission: 'customer',
        details: 'userDetails',
      };

      testDibsEasyOrder = {
        order: {
          reference: testOrder.id,
          items: [
            {
              reference: 'item1',
              name: 'Signatur 3',
              quantity: 1,
              unit: 'book',
              unitPrice: 20000,
              taxRate: 0,
              taxAmount: 0,
              grossTotalAmount: 20000,
              netTotalAmount: 20000,
            },
          ],
          amount: 20000,
          currency: 'NOK',
        },
        checkout: {
          url: '',
          termsUrl: '',
          ShippingCountries: [
            {
              countryCode: 'NOR',
            },
          ],
        },
      };

      testDelivery = {
        id: 'delivery1',
        method: 'bring',
        info: {
          branch: 'branch1',
        },
        order: 'order1',
        amount: 100,
      };

      orderUpdated = true;
      paymentUpdated = true;
      getPaymentIdConfirm = true;
      getDibsEasyOrderConfirm = true;
      testPaymentId = 'dibsPaymentId1';
    });

    sinon
      .stub(dibsPaymentService, 'orderToDibsEasyOrder')
      .callsFake((order: Order) => {
        return getDibsEasyOrderConfirm
          ? Promise.resolve(testDibsEasyOrder)
          : Promise.reject(new BlError('could not create dibs easy order'));
      });

    sinon.stub(userDetailStorage, 'get').callsFake((id: string) => {
      return {id: 'customer1', name: 'Billy Bob', email: 'billy@boklisten.co'};
    });

    sinon
      .stub(dibsPaymentService, 'getPaymentId')
      .callsFake((dibsEasyOrder: DibsEasyOrder) => {
        return getPaymentIdConfirm
          ? Promise.resolve(testPaymentId)
          : Promise.reject(new BlError('could not create paymentId'));
      });

    sinon.stub(paymentStorage, 'update').callsFake((id: string, data: any) => {
      if (!paymentUpdated) {
        return Promise.reject(new BlError('could not update payment'));
      }
      if (data['info']) {
        testPayment.info = data['info'];
      }
      return Promise.resolve(testPayment);
    });

    sinon.stub(orderStorage, 'get').callsFake((id: string) => {
      return id === testOrder.id
        ? Promise.resolve(testOrder)
        : Promise.reject(new BlError('order not found'));
    });

    sinon.stub(orderStorage, 'update').callsFake((id: string, data: any) => {
      if (!orderUpdated) {
        return Promise.reject(new BlError('could not update'));
      }

      if (data['payments']) {
        testOrder['payments'] = data['payments'];
      }

      return Promise.resolve(testOrder);
    });

    it('should reject if order is not found', () => {
      testPayment.order = 'notFoundOrder';

      return expect(
        paymentDibsHandler.handleDibsPayment(testPayment, testAccessToken),
      ).to.be.rejectedWith(BlError, /order not found/);
    });

    it('should reject if dibsPaymentService.orderToDibsEasyOrder rejects', () => {
      getDibsEasyOrderConfirm = false;

      return expect(
        paymentDibsHandler.handleDibsPayment(testPayment, testAccessToken),
      ).to.be.rejectedWith(BlError, /could not create dibs easy order/);
    });

    it('should reject if dibs paymentId could not be created', () => {
      getPaymentIdConfirm = false;

      return expect(
        paymentDibsHandler.handleDibsPayment(testPayment, testAccessToken),
      ).to.be.rejectedWith(BlError);
    });

    it('should resolve with a payment including the correct paymentId', done => {
      testPaymentId = 'testDibsPaymentId1';

      paymentDibsHandler
        .handleDibsPayment(testPayment, testAccessToken)
        .then((payment: Payment) => {
          expect(payment.info['paymentId']).to.eql(testPaymentId);
          done();
        });
    });
  });
});
