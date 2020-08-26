import {Order, Payment, AccessToken, BlError} from '@wizardcoder/bl-model';
import {isNullOrUndefined} from 'util';
import {DibsPaymentService} from '../../../../payment/dibs/dibs-payment.service';
import {paymentSchema} from '../../payment.schema';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';

export class PaymentDibsValidator {
  constructor(
    private _dibsPaymentService?: DibsPaymentService,
    private _paymentStorage?: BlDocumentStorage<Payment>,
  ) {
    this._dibsPaymentService = _dibsPaymentService
      ? _dibsPaymentService
      : new DibsPaymentService();

    this._paymentStorage = _paymentStorage
      ? _paymentStorage
      : new BlDocumentStorage('payments', paymentSchema);
  }

  public async validate(
    order: Order,
    payment: Payment,
    accessToken: AccessToken,
  ) {
    if (isNullOrUndefined(payment.info)) {
      throw new BlError(
        'payment.method is "dibs" but payment.info is undefined',
      );
    }

    if (isNullOrUndefined(payment.info['paymentId'])) {
      throw new BlError(
        'payment.method is "dibs" but payment.info.paymentId is undefined',
      );
    }

    let dibsEasyPayment;
    try {
      dibsEasyPayment = await this._dibsPaymentService.fetchDibsPaymentData(
        payment.info['paymentId'],
      );
    } catch (getDibsPaymentError) {
      throw new BlError('could not get dibs payment on dibs api').add(
        getDibsPaymentError,
      );
    }

    if (isNullOrUndefined(dibsEasyPayment.orderDetails)) {
      throw new BlError(
        'dibsEasyPayment was found, but dibsEasyPayment.orderDetails was undefined',
      )
        .store('dibsEasyPayment', dibsEasyPayment)
        .store('orderDetails', dibsEasyPayment['orderDetails']);
    }

    if (dibsEasyPayment.orderDetails.reference !== order.id) {
      throw new BlError(
        'dibsEasyPayment.orderDetails.reference is not equal to order.id',
      ).store('dibsEasyPayment', dibsEasyPayment);
    }

    if (isNullOrUndefined(dibsEasyPayment.summary)) {
      throw new BlError('dibsEasyPayment.summary is undefined').store(
        'dibsEasyPayment',
        dibsEasyPayment,
      );
    }

    if (isNullOrUndefined(dibsEasyPayment.summary.reservedAmount)) {
      throw new BlError(
        'dibsEasyPayment.summary.reservedAmount is undefined',
      ).store('dibsEasyPayment', dibsEasyPayment);
    }

    if (dibsEasyPayment.summary.reservedAmount !== payment.amount * 100) {
      throw new BlError(
        `dibsEasyPayment.summary.reservedAmount "${
          dibsEasyPayment.summary.reservedAmount
        }" is not equal to payment.amount "${payment.amount * 100}"`,
      ).store('dibsEasyPayment', dibsEasyPayment);
    }

    let updatedPayment;
    try {
      updatedPayment = await this._paymentStorage.update(
        payment.id,
        {info: dibsEasyPayment},
        {id: accessToken.sub, permission: accessToken.permission},
      );
    } catch (updatePaymentError) {
      throw new BlError('could not update payment with DibsEasyPayment').add(
        updatePaymentError,
      );
    }
    return true;
    /*
    try {
      await this._userDetailHelper.updateUserDetailBasedOnDibsEasyPayment(
        payment.customer as string,
        updatedPayment.info as DibsEasyPayment,
        accessToken,
      );
      return true;
    } catch (updateUserDetailError) {
      throw new BlError(
        'could not update user details based on dibsEasyPayment',
      )
        .store('userDetailId', payment.customer)
        .store('paymentId', payment.id)
        .add(updateUserDetailError);
    }
       */
  }
}
