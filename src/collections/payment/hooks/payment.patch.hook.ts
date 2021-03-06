import { Hook } from "../../../hook/hook";
import { AccessToken, Payment, BlError } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { paymentSchema } from "../payment.schema";
import { PaymentDibsHandler } from "../helpers/dibs/payment-dibs-handler";
import { PaymentValidator } from "../helpers/payment.validator";

export class PaymentPatchHook extends Hook {
  private paymentStorage: BlDocumentStorage<Payment>;
  private paymentDibsHandler: PaymentDibsHandler;
  private paymentValidator: PaymentValidator;

  constructor(
    paymentStorage?: BlDocumentStorage<Payment>,
    paymentDibsHandler?: PaymentDibsHandler,
    paymentValidator?: PaymentValidator
  ) {
    super();
    this.paymentStorage = paymentStorage
      ? paymentStorage
      : new BlDocumentStorage("payments", paymentSchema);
    this.paymentDibsHandler = paymentDibsHandler
      ? paymentDibsHandler
      : new PaymentDibsHandler();
    this.paymentValidator = paymentValidator
      ? paymentValidator
      : new PaymentValidator();
  }

  before(body: any, accessToken: AccessToken, id: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  after(payments: Payment[], accessToken: AccessToken): Promise<Payment[]> {
    if (!payments || payments.length !== 1) {
      return Promise.reject(new BlError("payments are empty or undefined"));
    }

    let payment: Payment = payments[0];

    return this.updatePaymentBasedOnMethod(payment, accessToken)
      .then((updatedPayment: Payment) => {
        payment = updatedPayment;
        return this.paymentValidator.validate(updatedPayment);
      })
      .then(() => {
        return [payment];
      })
      .catch((paymentPatchError: BlError) => {
        throw paymentPatchError;
      });
  }

  private updatePaymentBasedOnMethod(
    payment: Payment,
    accessToken: AccessToken
  ): Promise<Payment> {
    switch (payment.method) {
      case "later":
        return this.handlePaymentLater(payment, accessToken);
      case "dibs":
        return this.paymentDibsHandler.handleDibsPayment(payment, accessToken);
      default:
        return Promise.reject(
          new BlError(`payment.method "${payment.method}" not supported`)
        );
    }
  }

  private handlePaymentLater(
    payment: Payment,
    accessToken: AccessToken
  ): Promise<Payment> {
    return Promise.resolve(payment);
  }
}
