/* eslint-disable @typescript-eslint/no-unused-vars */
import { Payment, Order, BlError, Delivery } from "@boklisten/bl-model";

import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { deliverySchema } from "../../delivery/delivery.schema";
import { orderSchema } from "../../order/order.schema";

export class PaymentValidator {
  private orderStorage?: BlDocumentStorage<Order>;
  private deliveryStorage?: BlDocumentStorage<Delivery>;

  constructor(
    orderStorage?: BlDocumentStorage<Order>,
    paymentStorage?: BlDocumentStorage<Payment>,
    deliveryStorage?: BlDocumentStorage<Delivery>,
  ) {
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this.deliveryStorage = deliveryStorage
      ? deliveryStorage
      : new BlDocumentStorage<Delivery>(
          BlCollectionName.Deliveries,
          deliverySchema,
        );
  }

  public validate(payment: Payment): Promise<boolean> {
    if (!payment) {
      return Promise.reject(new BlError("payment is not defined"));
    }

    let order: Order;

    return this.orderStorage
      .get(payment.order as string)
      .then((orderInStorage: Order) => {
        order = orderInStorage;
        return this.validateIfOrderHasDelivery(payment, order);
      })
      .then(() => {
        return this.validatePaymentBasedOnMethod(payment, order);
      })
      .catch((validatePaymentError: BlError) => {
        if (validatePaymentError instanceof BlError) {
          throw validatePaymentError;
        }
        throw new BlError("could not validate payment, unknown error").store(
          "error",
          validatePaymentError,
        );
      });
  }

  private validateIfOrderHasDelivery(
    payment: Payment,
    order: Order,
  ): Promise<boolean> {
    if (!order.delivery) {
      return Promise.resolve(true);
    }

    return this.deliveryStorage
      .get(order.delivery as string)
      .then((delivery: Delivery) => {
        const expectedAmount = order.amount + delivery.amount;

        if (payment.amount !== expectedAmount) {
          throw new BlError(
            `payment.amount "${payment.amount}" is not equal to (order.amount + delivery.amount) "${expectedAmount}"`,
          );
        }
        return true;
      });
  }

  private validatePaymentBasedOnMethod(
    payment: Payment,
    order: Order,
  ): Promise<boolean> {
    switch (payment.method) {
      case "dibs":
        return this.validatePaymentDibs(payment, order);
      case "card":
        return this.validatePaymentCard(payment, order);
      case "cash":
        return this.validatePaymentCash(payment, order);
      case "vipps":
        return this.validatePaymentVipps(payment, order);
      default:
        throw new BlError(`payment.method "${payment.method}" not supported`);
    }
  }

  private validatePaymentDibs(
    payment: Payment,
    order: Order,
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  private validatePaymentCard(
    payment: Payment,
    order: Order,
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  private validatePaymentVipps(
    payment: Payment,
    order: Order,
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  private validatePaymentCash(
    payment: Payment,
    order: Order,
  ): Promise<boolean> {
    return Promise.resolve(true);
  }
}
