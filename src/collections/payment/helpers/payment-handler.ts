import {AccessToken, BlError, Order, Payment} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {paymentSchema} from '../payment.schema';
import {DibsPaymentService} from '../../../payment/dibs/dibs-payment.service';
import {DibsEasyPayment} from '../../../payment/dibs/dibs-easy-payment/dibs-easy-payment';
import {isNullOrUndefined} from 'util';
import {UserDetailHelper} from '../../user-detail/helpers/user-detail.helper';
import {PaymentDibsValidator} from './dibs/payment-dibs-validator';

export class PaymentHandler {
  private paymentStorage: BlDocumentStorage<Payment>;
  private dibsPaymentService: DibsPaymentService;
  private _userDetailHelper: UserDetailHelper;

  constructor(
    paymentStorage?: BlDocumentStorage<Payment>,
    dibsPaymentService?: DibsPaymentService,
    userDetailHelper?: UserDetailHelper,
    private _paymentDibsValidator?: PaymentDibsValidator,
  ) {
    this.paymentStorage = paymentStorage
      ? paymentStorage
      : new BlDocumentStorage('payments', paymentSchema);
    this.dibsPaymentService = dibsPaymentService
      ? dibsPaymentService
      : new DibsPaymentService();
    this._userDetailHelper = userDetailHelper
      ? userDetailHelper
      : new UserDetailHelper();
    this._paymentDibsValidator = _paymentDibsValidator
      ? _paymentDibsValidator
      : new PaymentDibsValidator();
  }

  public async confirmPayments(
    order: Order,
    accessToken: AccessToken,
  ): Promise<Payment[]> {
    if (!order.payments || order.payments.length <= 0) {
      return [];
    }

    let payments: Payment[];

    try {
      payments = await this.paymentStorage.getMany(order.payments as string[]);
    } catch (e) {
      throw new BlError('one or more payments was not found');
    }

    try {
      return await this.confirmAllPayments(order, payments, accessToken);
    } catch (e) {
      throw e;
    }
  }

  private async confirmAllPayments(
    order: Order,
    payments: Payment[],
    accessToken: AccessToken,
  ): Promise<Payment[]> {
    this.validateOrderAmount(order, payments);
    this.validatePaymentMethods(payments);

    for (let payment of payments) {
      if (payment.confirmed) {
        continue;
      }

      try {
        await this.confirmPayment(order, payment, accessToken);
        await this.paymentStorage.update(
          payment.id,
          {confirmed: true},
          {id: accessToken.sub, permission: accessToken.permission},
        );
      } catch (e) {
        throw e;
      }
    }
    return payments;
  }

  private confirmPayment(
    order: Order,
    payment: Payment,
    accessToken: AccessToken,
  ): Promise<boolean> {
    switch (payment.method) {
      case 'dibs':
        return this.confirmMethodDibs(order, payment, accessToken);
      case 'card':
        return this.confirmMethodCard(order, payment);
      case 'cash':
        return this.confirmMethodCash(order, payment);
      case 'vipps':
        return this.confirmMethodVipps(order, payment);
      default:
        return Promise.reject(
          new BlError(`payment method "${payment.method}" not supported`),
        );
    }
  }

  private confirmMethodCard(order: Order, payment: Payment): Promise<boolean> {
    if (order.byCustomer) {
      throw new BlError('payment method "card" is not permitted for customer');
    }
    return Promise.resolve(true);
  }

  private confirmMethodVipps(order: Order, payment: Payment): Promise<boolean> {
    if (order.byCustomer) {
      throw new BlError('payment method "vipps" is not permitted for customer');
    }
    return Promise.resolve(true);
  }

  private confirmMethodCash(order: Order, payment: Payment): Promise<boolean> {
    if (order.byCustomer) {
      throw new BlError('payment method "cash" is not permitted for customer');
    }
    return Promise.resolve(true);
  }

  private validatePaymentMethods(payments: Payment[]) {
    if (payments.length > 1) {
      for (let payment of payments) {
        if (payment.method == 'dibs') {
          throw new BlError(
            `multiple payments found but "${payment.id}" have method dibs`,
          );
        }
      }
    }
    return true;
  }

  private validateOrderAmount(order, payments: Payment[]): boolean {
    let total = 0;

    payments.forEach(payment => {
      total += payment.amount;
    });

    if (total !== order.amount) {
      throw new BlError('total of payment amounts does not equal order.amount');
    }

    return true;
  }

  private async confirmMethodDibs(
    order: Order,
    payment: Payment,
    accessToken: AccessToken,
  ): Promise<boolean> {
    return this._paymentDibsValidator.validate(order, payment, accessToken);
  }
}
