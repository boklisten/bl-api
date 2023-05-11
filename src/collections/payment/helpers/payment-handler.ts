import {
  AccessToken,
  BlError,
  Order,
  Payment,
  Delivery,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { paymentSchema } from "../payment.schema";
import { DibsPaymentService } from "../../../payment/dibs/dibs-payment.service";
import { UserDetailHelper } from "../../user-detail/helpers/user-detail.helper";
import { PaymentDibsConfirmer } from "./dibs/payment-dibs-confirmer";
import { deliverySchema } from "../../delivery/delivery.schema";
import { BlCollectionName } from "../../bl-collection";

export class PaymentHandler {
  private paymentStorage: BlDocumentStorage<Payment>;

  constructor(
    paymentStorage?: BlDocumentStorage<Payment>,
    dibsPaymentService?: DibsPaymentService,
    userDetailHelper?: UserDetailHelper,
    private _paymentDibsConfirmer?: PaymentDibsConfirmer,
    private _deliveryStorage?: BlDocumentStorage<Delivery>
  ) {
    this.paymentStorage = paymentStorage
      ? paymentStorage
      : new BlDocumentStorage(BlCollectionName.Payments, paymentSchema);
    this._paymentDibsConfirmer = _paymentDibsConfirmer
      ? _paymentDibsConfirmer
      : new PaymentDibsConfirmer();
    this._deliveryStorage = _deliveryStorage
      ? _deliveryStorage
      : new BlDocumentStorage(BlCollectionName.Deliveries, deliverySchema);
  }

  public async confirmPayments(
    order: Order,
    accessToken: AccessToken
  ): Promise<Payment[]> {
    if (!order.payments || order.payments.length <= 0) {
      return [];
    }

    let payments: Payment[];

    try {
      payments = await this.paymentStorage.getMany(order.payments as string[]);
    } catch (e) {
      throw new BlError("one or more payments was not found");
    }

    // eslint-disable-next-line no-useless-catch
    try {
      return await this.confirmAllPayments(order, payments, accessToken);
    } catch (e) {
      throw e;
    }
  }

  private async confirmAllPayments(
    order: Order,
    payments: Payment[],
    accessToken: AccessToken
  ): Promise<Payment[]> {
    await this.validateOrderAmount(order, payments);
    this.validatePaymentMethods(payments);

    for (const payment of payments) {
      if (payment.confirmed) {
        continue;
      }

      // eslint-disable-next-line no-useless-catch
      try {
        await this.confirmPayment(order, payment, accessToken);
        await this.paymentStorage.update(
          payment.id,
          { confirmed: true },
          { id: accessToken.sub, permission: accessToken.permission }
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
    accessToken: AccessToken
  ): Promise<boolean> {
    switch (payment.method) {
      case "dibs":
        return this.confirmMethodDibs(order, payment, accessToken);
      case "card":
        return this.confirmMethodCard(order, payment);
      case "cash":
        return this.confirmMethodCash(order, payment);
      case "vipps":
        return this.confirmMethodVipps(order, payment);
      default:
        return Promise.reject(
          new BlError(`payment method "${payment.method}" not supported`)
        );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private confirmMethodCard(order: Order, payment: Payment): Promise<boolean> {
    if (order.byCustomer) {
      throw new BlError('payment method "card" is not permitted for customer');
    }
    return Promise.resolve(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private confirmMethodVipps(order: Order, payment: Payment): Promise<boolean> {
    if (order.byCustomer) {
      throw new BlError('payment method "vipps" is not permitted for customer');
    }
    return Promise.resolve(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private confirmMethodCash(order: Order, payment: Payment): Promise<boolean> {
    if (order.byCustomer) {
      throw new BlError('payment method "cash" is not permitted for customer');
    }
    return Promise.resolve(true);
  }

  private validatePaymentMethods(payments: Payment[]) {
    if (payments.length > 1) {
      for (const payment of payments) {
        if (payment.method == "dibs") {
          throw new BlError(
            `multiple payments found but "${payment.id}" have method dibs`
          );
        }
      }
    }
    return true;
  }

  private async validateOrderAmount(
    order,
    payments: Payment[]
  ): Promise<boolean> {
    const total = payments.reduce(
      (subTotal, payment) => subTotal + payment.amount,
      0
    );
    let orderTotal = order.amount;

    if (order.delivery) {
      // eslint-disable-next-line no-useless-catch
      try {
        const delivery = await this._deliveryStorage.get(order.delivery);
        orderTotal += delivery.amount;
      } catch (e) {
        throw e;
      }
    }

    if (total !== orderTotal) {
      throw new BlError(
        "total of payment amounts does not equal order.amount + delivery.amount"
      );
    }

    return true;
  }

  private async confirmMethodDibs(
    order: Order,
    payment: Payment,
    accessToken: AccessToken
  ): Promise<boolean> {
    return this._paymentDibsConfirmer.confirm(order, payment, accessToken);
  }
}
