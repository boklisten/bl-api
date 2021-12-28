import { Hook } from "../../../hook/hook";
import { BlError, Order, Payment, AccessToken } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { orderSchema } from "../../order/order.schema";
import { PaymentValidator } from "../helpers/payment.validator";
import { PaymentDibsHandler } from "../helpers/dibs/payment-dibs-handler";

export class PaymentPostHook extends Hook {
  private orderStorage: BlDocumentStorage<Order>;
  private paymentValidator: PaymentValidator;
  private paymentDibsHandler: PaymentDibsHandler;

  constructor(
    paymentStorage?: BlDocumentStorage<Payment>,
    orderStorage?: BlDocumentStorage<Order>,
    paymentValidator?: PaymentValidator,
    paymentDibsHandler?: PaymentDibsHandler
  ) {
    super();
    this.paymentValidator = paymentValidator ?? new PaymentValidator();
    this.orderStorage =
      orderStorage ?? new BlDocumentStorage("orders", orderSchema);
    this.paymentDibsHandler = paymentDibsHandler ?? new PaymentDibsHandler();
  }

  public override before(): Promise<boolean> {
    return new Promise((resolve) => {
      resolve(true);
    });
  }

  public override after(
    payments: Payment[],
    accessToken: AccessToken
  ): Promise<Payment[]> {
    return new Promise((resolve, reject) => {
      if (!payments || payments.length != 1) {
        return reject(new BlError("payments is empty or undefined"));
      }

      if (!accessToken) {
        return reject(new BlError("accessToken is undefined"));
      }

      const payment = payments[0];

      this.paymentValidator
        .validate(payment)
        .then(() => {
          this.handlePaymentBasedOnMethod(payment, accessToken)
            .then((updatedPayment: Payment) => {
              this.updateOrderWithPayment(updatedPayment, accessToken)
                .then(() => {
                  resolve([updatedPayment]);
                })
                .catch((updateOrderError: BlError) => {
                  reject(
                    new BlError(
                      "order could not be updated with paymentId"
                    ).add(updateOrderError)
                  );
                });
            })
            .catch((handlePaymentMethodError: BlError) => {
              reject(handlePaymentMethodError);
            });
        })
        .catch((blError: BlError) => {
          reject(new BlError("payment could not be validated").add(blError));
        });
    });
  }

  private handlePaymentBasedOnMethod(
    payment: Payment,
    accessToken: AccessToken
  ): Promise<Payment> {
    return new Promise((resolve, reject) => {
      switch (payment.method) {
        case "dibs":
          return this.paymentDibsHandler
            .handleDibsPayment(payment, accessToken)
            .then((updatedPayment: Payment) => {
              return resolve(updatedPayment);
            })
            .catch((blError: BlError) => {
              reject(blError);
            });
        default:
          return resolve(payment);
      }
    });
  }

  private updateOrderWithPayment(
    payment: Payment,
    accessToken: AccessToken
  ): Promise<Payment> {
    return new Promise((resolve, reject) => {
      this.orderStorage
        .get(payment.order as string)
        .then((order: Order) => {
          const paymentIds: string[] = order.payments
            ? (order.payments as string[])
            : [];

          if (paymentIds.indexOf(payment.id) > -1) {
            reject(
              new BlError(
                `order.payments already includes payment "${payment.id}"`
              )
            );
          } else {
            paymentIds.push(payment.id);
          }
          return this.orderStorage
            .update(
              order.id,
              { payments: paymentIds },
              { id: accessToken.sub, permission: accessToken.permission }
            )
            .then(() => {
              resolve(payment);
            })
            .catch((blError: BlError) => {
              reject(new BlError("could not update orders").add(blError));
            });
        })
        .catch(() => {
          reject(new BlError("could not get order when adding payment id"));
        });
    });
  }
}
