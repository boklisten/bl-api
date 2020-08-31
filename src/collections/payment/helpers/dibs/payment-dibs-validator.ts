import {Order, Payment, AccessToken, BlError} from '@wizardcoder/bl-model';
import {isNullOrUndefined} from 'util';
import {DibsPaymentService} from '../../../../payment/dibs/dibs-payment.service';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {DibsEasyPayment} from '../../../../payment/dibs/dibs-easy-payment/dibs-easy-payment';

export class PaymentDibsValidator {
  constructor(private _dibsPaymentService?: DibsPaymentService) {
    this._dibsPaymentService = _dibsPaymentService
      ? _dibsPaymentService
      : new DibsPaymentService();
  }

  public async validate(
    order: Order,
    payment: Payment,
    accessToken: AccessToken,
  ): Promise<boolean> {
    this.validatePaymentInfo(payment);

    let dibsEasyPaymentDetails;
    try {
      dibsEasyPaymentDetails = await this._dibsPaymentService.fetchDibsPaymentData(
        payment.info['paymentId'],
      );
    } catch (getDibsPaymentError) {
      throw new BlError('could not get dibs payment from dibs api').add(
        getDibsPaymentError,
      );
    }

    this.validateDibsEasyPayment(order, payment, dibsEasyPaymentDetails);

    return true;
    /*

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
       */
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

  private validateDibsEasyPayment(
    order: Order,
    payment: Payment,
    dibsEasyPaymentDetails: DibsEasyPayment,
  ): boolean {
    if (
      isNullOrUndefined(dibsEasyPaymentDetails.orderDetails) ||
      dibsEasyPaymentDetails.orderDetails.reference !== order.id
    ) {
      throw new BlError(
        'dibsEasyPaymentDetails.orderDetails.reference is not equal to order.id',
      );
    }

    if (
      isNullOrUndefined(dibsEasyPaymentDetails.summary) ||
      isNullOrUndefined(dibsEasyPaymentDetails.summary.reservedAmount) ||
      parseInt('' + dibsEasyPaymentDetails.summary.reservedAmount, 10) !==
        payment.amount * 100
    ) {
      throw new BlError(
        `dibsEasyPaymentDetails.summary.reservedAmount "${
          dibsEasyPaymentDetails.summary.reservedAmount
        }" is not equal to payment.amount "${payment.amount * 100}"`,
      );
    }
    return false;
  }

  private validatePaymentInfo(payment: Payment): boolean {
    if (
      isNullOrUndefined(payment.info) ||
      isNullOrUndefined(payment.info['paymentId'])
    ) {
      throw new BlError(
        'payment.method is "dibs" but payment.info.paymentId is undefined',
      );
    }

    return true;
  }
}
