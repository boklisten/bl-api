import { DibsPaymentService } from "../../../../payment/dibs/dibs-payment.service";
import { DibsEasyOrder } from "../../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import {
  BlError,
  Payment,
  Order,
  AccessToken,
  Delivery,
  UserDetail,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { paymentSchema } from "../../payment.schema";
import { orderSchema } from "../../../order/order.schema";
import { SystemUser } from "../../../../auth/permission/permission.service";
import { deliverySchema } from "../../../delivery/delivery.schema";
import { userDetailSchema } from "../../../user-detail/user-detail.schema";

export class PaymentDibsHandler {
  private paymentStorage: BlDocumentStorage<Payment>;
  private orderStorage: BlDocumentStorage<Order>;
  private dibsPaymentService: DibsPaymentService;
  private deliveryStorage: BlDocumentStorage<Delivery>;
  private userDetailStorage: BlDocumentStorage<UserDetail>;

  constructor(
    paymentStorage?: BlDocumentStorage<Payment>,
    orderStorage?: BlDocumentStorage<Order>,
    dibsPaymentService?: DibsPaymentService,
    deliveryStorage?: BlDocumentStorage<Delivery>,
    userDetailStorage?: BlDocumentStorage<UserDetail>
  ) {
    this.paymentStorage = paymentStorage
      ? paymentStorage
      : new BlDocumentStorage("payments", paymentSchema);
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage("orders", orderSchema);
    this.dibsPaymentService = dibsPaymentService
      ? dibsPaymentService
      : new DibsPaymentService();
    this.deliveryStorage = deliveryStorage
      ? deliveryStorage
      : new BlDocumentStorage("deliveries", deliverySchema);
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
  }

  public async handleDibsPayment(
    payment: Payment,
    accessToken: AccessToken
  ): Promise<Payment> {
    let order: Order;

    try {
      const order = await this.orderStorage.get(payment.order as string);
      const userDetail = await this.userDetailStorage.get(
        payment.customer as string
      );
      const dibsEasyOrder: DibsEasyOrder = await this.getDibsEasyOrder(
        userDetail,
        order
      );
      const paymentId = await this.dibsPaymentService.getPaymentId(
        dibsEasyOrder
      );
      const updatedPayment = await this.paymentStorage.update(
        payment.id,
        { info: { paymentId: paymentId } },
        { id: accessToken.sub, permission: accessToken.permission }
      );

      return updatedPayment;
    } catch (createDibsPaymentError) {
      throw createDibsPaymentError;
    }
    /*
    return this.orderStorage
      .get(payment.order as string)
      .then((theOrder: Order) => {
        order = theOrder;
        let userDetail = {} as any;
        return this.getDibsEasyOrder(userDetail, theOrder);
      })
      .then((dibsEasyOrder: DibsEasyOrder) => {
        return this.dibsPaymentService.getPaymentId(dibsEasyOrder);
      })
      .then((paymentId: string) => {
        return this.paymentStorage.update(
          payment.id,
          {info: {paymentId: paymentId}},
          {id: accessToken.sub, permission: accessToken.permission},
        );
      })
      .then((updatedPayment: Payment) => {
        return updatedPayment;
      })
      .catch((createDibsPaymentError: BlError) => {
        throw createDibsPaymentError;
      });
*/
  }

  private getDibsEasyOrder(
    userDetail: UserDetail,
    order: Order
  ): Promise<DibsEasyOrder> {
    if (order.delivery) {
      return this.deliveryStorage
        .get(order.delivery as string)
        .then((delivery: Delivery) => {
          return this.dibsPaymentService.orderToDibsEasyOrder(
            userDetail,
            order,
            delivery
          );
        });
    }
    return Promise.resolve(
      this.dibsPaymentService.orderToDibsEasyOrder(userDetail, order)
    );
  }
}
