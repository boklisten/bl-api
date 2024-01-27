import { isNullOrUndefined } from "util";

import { Order, Payment, AccessToken, BlError } from "@boklisten/bl-model";

import { DibsEasyPayment } from "../../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import { DibsPaymentService } from "../../../../payment/dibs/dibs-payment.service";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../bl-collection";
import { paymentSchema } from "../../payment.schema";

export class PaymentDibsConfirmer {
  constructor(
    private _dibsPaymentService?: DibsPaymentService,
    private _paymentStorage?: BlDocumentStorage<Payment>,
  ) {
    this._dibsPaymentService = _dibsPaymentService
      ? _dibsPaymentService
      : new DibsPaymentService();
    this._paymentStorage = _paymentStorage
      ? _paymentStorage
      : new BlDocumentStorage(BlCollectionName.Payments, paymentSchema);
  }

  public async confirm(
    order: Order,
    payment: Payment,
    accessToken: AccessToken,
  ): Promise<boolean> {
    let dibsEasyPaymentDetails;
    if (payment.amount >= 0) {
      this.validatePaymentInfo(payment);

      try {
        dibsEasyPaymentDetails =
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await this._dibsPaymentService.fetchDibsPaymentData(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            payment.info["paymentId"],
          );
      } catch (getDibsPaymentError) {
        throw new BlError("could not get dibs payment from dibs api").add(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          getDibsPaymentError,
        );
      }

      this.validateDibsEasyPayment(order, payment, dibsEasyPaymentDetails);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await this._paymentStorage.update(
        payment.id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        { info: dibsEasyPaymentDetails },
        { id: accessToken.details, permission: accessToken.permission },
      );
    } catch (e) {
      throw new BlError(
        "payment could not be updated with dibs information:" + e,
      );
    }

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
        "dibsEasyPaymentDetails.orderDetails.reference is not equal to order.id",
      );
    }

    if (
      isNullOrUndefined(dibsEasyPaymentDetails.summary) ||
      isNullOrUndefined(dibsEasyPaymentDetails.summary.reservedAmount) ||
      parseInt("" + dibsEasyPaymentDetails.summary.reservedAmount, 10) !==
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      isNullOrUndefined(payment.info["paymentId"])
    ) {
      throw new BlError(
        'payment.method is "dibs" but payment.info.paymentId is undefined',
      );
    }

    return true;
  }
}
