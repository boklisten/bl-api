import {
  BlError,
  Delivery,
  Order,
  OrderItem,
  UserDetail,
} from "@boklisten/bl-model";
import { DibsEasyItem } from "./dibs-easy-item/dibs-easy-item";
import { DibsEasyOrder } from "./dibs-easy-order/dibs-easy-order";
import { HttpHandler } from "../../http/http.handler";
import { APP_CONFIG } from "../../application-config";
import { DibsEasyPayment } from "./dibs-easy-payment/dibs-easy-payment";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { deliverySchema } from "../../collections/delivery/delivery.schema";
import { TypedJSON } from "typedjson-npm";
import { UserDetailHelper } from "../../collections/user-detail/helpers/user-detail.helper";

export class DibsPaymentService {
  private deliveryStorage: BlDocumentStorage<Delivery>;
  private _userDetailHelper: UserDetailHelper;
  private _httpHandler: HttpHandler;

  constructor(
    deliveryStorage?: BlDocumentStorage<Delivery>,
    httpHandler?: HttpHandler
  ) {
    this.deliveryStorage = deliveryStorage
      ? deliveryStorage
      : new BlDocumentStorage<Delivery>("deliveries", deliverySchema);
    this._httpHandler = httpHandler ? httpHandler : new HttpHandler();
    this._userDetailHelper = new UserDetailHelper();
  }

  public getPaymentId(dibsEasyOrder: DibsEasyOrder): Promise<string> {
    return new Promise((resolve, reject) => {
      this._httpHandler
        .post(
          process.env.DIBS_URI + APP_CONFIG.path.dibs.payment,
          dibsEasyOrder,
          process.env.DIBS_SECRET_KEY
        )
        .then((responseData: string) => {
          if (responseData) {
            if (responseData["paymentId"]) {
              return resolve(responseData["paymentId"]);
            }
          }
          return reject(
            new BlError("did not get the paymentId back from dibs")
          );
        })
        .catch((blError: BlError) => {
          reject(new BlError("could not get paymentID from dibs").add(blError));
        });
    });
  }

  public fetchDibsPaymentData(paymentId: string): Promise<DibsEasyPayment> {
    return this._httpHandler
      .get(
        process.env.DIBS_URI + APP_CONFIG.path.dibs.payment + "/" + paymentId,
        process.env.DIBS_SECRET_KEY
      )
      .then((response) => {
        if (!response["payment"]) {
          throw new BlError(
            "dibs response did not include payment information"
          ).store("paymentId", paymentId);
        }
        return TypedJSON.parse(response["payment"], DibsEasyPayment);
      })
      .catch((getDibsPaymentDetailError: BlError) => {
        throw new BlError(
          `could not get payment details for paymentId "${paymentId}"`
        ).add(getDibsPaymentDetailError);
      });
  }

  public orderToDibsEasyOrder(
    userDetail: UserDetail,
    order: Order,
    delivery?: Delivery
  ): DibsEasyOrder {
    this.validateOrder(order);
    this.validateOrderPayments(order.payments as string[]);

    let items: DibsEasyItem[] = [];

    for (let orderItem of order.orderItems) {
      items.push(this.orderItemToEasyItem(orderItem));
    }

    if (order.delivery && delivery && delivery.amount > 0) {
      items.push(this.deliveryToDibsEasyItem(delivery));
    }

    let dibsEasyOrder: DibsEasyOrder = new DibsEasyOrder();

    dibsEasyOrder.order.reference = order.id;
    dibsEasyOrder.order.items = items;
    dibsEasyOrder.order.amount = this.getTotalGrossAmount(items);
    dibsEasyOrder.order.currency = "NOK";

    let userDetailValid = this._userDetailHelper.isValid(userDetail);

    dibsEasyOrder.checkout = {
      url: process.env.CLIENT_URI + APP_CONFIG.path.client.checkout,
      termsUrl: process.env.CLIENT_URI + APP_CONFIG.path.client.agreement.rent,
      ShippingCountries: [{ countryCode: "NOR" }],
      merchantHandlesConsumerData: userDetailValid, // if userDetail is not valid, the customer must reenter data
      consumer: userDetailValid
        ? this.userDetailToDibsEasyConsumer(userDetail)
        : null,
    };

    return dibsEasyOrder;
  }

  private userDetailToDibsEasyConsumer(userDetail: UserDetail): any {
    return {
      email: userDetail.email,
      shippingAddress: {
        addressLine1: userDetail.address,
        addressLine2: "",
        postalCode: userDetail.postCode,
        city: userDetail.postCity,
        country: "NOR",
      },
      phoneNumber: {
        prefix: "+47",
        number: userDetail.phone,
      },
      privatePerson: {
        firstName: this._userDetailHelper.getFirstName(userDetail.name),
        lastName: this._userDetailHelper.getLastName(userDetail.name),
      },
    };
  }

  private deliveryToDibsEasyItem(delivery: Delivery): DibsEasyItem {
    return {
      reference: delivery.id,
      name: "delivery",
      quantity: 1,
      unit: "delivery",
      unitPrice: this.toEars(delivery.amount),
      taxRate: 0,
      taxAmount: delivery.taxAmount ? this.toEars(delivery.taxAmount) : 0,
      grossTotalAmount: this.toEars(delivery.amount),
      netTotalAmount: this.toEars(delivery.amount),
    };
  }

  private validateOrder(order: Order) {
    if (!order.id || order.id.length <= 0)
      throw new BlError("order.id is not defined");
    if (!order.byCustomer)
      throw new BlError(
        "order.byCustomer is false, no need to make dibs easy order"
      );
    if (order.amount == 0) throw new BlError("order.amount is zero");
  }

  private validateOrderPayments(payments: string[]) {
    /*
		let numOfDibsPayments = 0;

		for (let payment of payments) {
			if (payment.method === "dibs") {
				numOfDibsPayments += 1;
			}
		}

		if (numOfDibsPayments > 1) {
			throw new BlError('order.payments include more than one payment with method "dibs"');
		}

		if (numOfDibsPayments < 1) {
			throw new BlError('order.payments does not include a payment with method "dibs"');
		}
		*/
  }

  private getTotalGrossAmount(dibsEasyItems: DibsEasyItem[]): number {
    let sum = 0;
    for (let dbi of dibsEasyItems) {
      sum += dbi.grossTotalAmount;
    }
    return sum;
  }

  private orderItemToEasyItem(orderItem: OrderItem): DibsEasyItem {
    let dibsEasyItem = new DibsEasyItem();

    dibsEasyItem.reference = orderItem.item as string;
    dibsEasyItem.name = orderItem.title;
    dibsEasyItem.quantity = 1;
    dibsEasyItem.unit = "book";
    dibsEasyItem.unitPrice = this.toEars(orderItem.unitPrice);
    dibsEasyItem.taxRate = this.toEars(orderItem.taxRate * 100);
    dibsEasyItem.taxAmount = this.toEars(orderItem.taxAmount);
    dibsEasyItem.netTotalAmount = this.toEars(orderItem.unitPrice);
    dibsEasyItem.grossTotalAmount = this.toEars(orderItem.amount);

    return dibsEasyItem;
  }

  private toEars(price: number): number {
    return price * 100;
  }
}
