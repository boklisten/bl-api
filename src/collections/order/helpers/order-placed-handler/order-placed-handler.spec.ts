// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import {
  BlError,
  Order,
  OrderItem,
  CustomerItem,
  Payment,
  AccessToken,
  UserDetail,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { OrderPlacedHandler } from "./order-placed-handler";
import { PaymentHandler } from "../../../payment/helpers/payment-handler";
import { Messenger } from "../../../../messenger/messenger";
import { OrderItemMovedFromOrderHandler } from "../order-item-moved-from-order-handler/order-item-moved-from-order-handler";
import { CustomerItemHandler } from "../../../customer-item/helpers/customer-item-handler";

chai.use(chaiAsPromised);

describe("OrderPlacedHandler", () => {
  let testOrder: Order;
  let testPayment: Payment;
  let paymentsConfirmed: boolean;
  let testAccessToken: AccessToken;
  let orderUpdate: boolean;
  let testUserDetail: UserDetail;
  let userDeatilUpdate: boolean;

  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    "customeritems"
  );
  const orderStorage = new BlDocumentStorage<Order>("orders");
  const paymentHandler = new PaymentHandler();
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");
  const messenger = new Messenger();
  const orderItemMovedFromOrderHandler = new OrderItemMovedFromOrderHandler();
  const customerItemHandler = new CustomerItemHandler();
  const orderPlacedHandler = new OrderPlacedHandler(
    customerItemStorage,
    orderStorage,
    paymentHandler,
    userDetailStorage,
    messenger,
    customerItemHandler,
    orderItemMovedFromOrderHandler
  );

  sinon.stub(orderItemMovedFromOrderHandler, "updateOrderItems").resolves(true);

  sinon
    .stub(customerItemStorage, "add")
    .callsFake((customerItem: CustomerItem) => {
      if (customerItem.item === "item1") {
        customerItem.id = "customerItem1";
        return Promise.resolve(customerItem);
      } else if (customerItem.item === "item2") {
        customerItem.id = "customerItem2";
        return Promise.resolve(customerItem);
      } else {
        return Promise.reject("could not add doc");
      }
    });

  sinon.stub(userDetailStorage, "get").callsFake((id: string) => {
    if (id !== testUserDetail.id) {
      return Promise.reject(new BlError("user detail not found"));
    }

    return Promise.resolve(testUserDetail);
  });

  sinon.stub(userDetailStorage, "update").callsFake((id: string, data: any) => {
    if (userDeatilUpdate) {
      if (data["orders"]) {
        testUserDetail.orders = data["orders"];
        return Promise.resolve(testUserDetail);
      }
    }
    return Promise.reject(new BlError("could not update user detail"));
  });

  sinon.stub(paymentHandler, "confirmPayments").callsFake((ids: string[]) => {
    if (!paymentsConfirmed) {
      return Promise.reject(new BlError("could not confirm payments"));
    }

    return Promise.resolve([testPayment]);
  });

  sinon.stub(orderStorage, "update").callsFake((id: string, data: any) => {
    if (!orderUpdate) {
      return Promise.reject(new BlError("could not update order"));
    }
    return Promise.resolve(testOrder);
  });

  const getOrderStub = sinon.stub(orderStorage, "get");

  sinon.stub(messenger, "orderPlaced").callsFake(() => {
    return true;
  });

  beforeEach(() => {
    paymentsConfirmed = true;
    orderUpdate = true;
    userDeatilUpdate = true;

    testOrder = {
      id: "branch1",
      amount: 100,
      orderItems: [
        {
          type: "rent",
          item: "item2",
          title: "Signatur 3: Tekstsammling",
          amount: 50,
          unitPrice: 100,
          taxRate: 0.5,
          taxAmount: 25,
          info: {
            from: new Date(),
            to: new Date(),
            numberOfPeriods: 1,
            periodType: "semester",
          },
        },
      ],
      branch: "branch1",
      customer: "customer1",
      byCustomer: true,
      placed: true,
      payments: [],
      delivery: "delivery1",
    };

    testPayment = {
      id: "payment1",
      method: "dibs",
      order: "order1",
      amount: 200,
      customer: "customer1",
      branch: "branch1",
      taxAmount: 0,
      info: {
        paymentId: "dibsEasyPayment1",
      },
    };

    testAccessToken = {
      iss: "boklisten.co",
      aud: "boklisten.co",
      iat: 1,
      exp: 1,
      sub: "userDetail1",
      permission: "customer",
      details: "userDetail1",
      username: "user@name.com",
    };

    testUserDetail = {
      id: "customer1",
      name: "",
      email: "",
      phone: "",
      address: "",
      postCode: "",
      postCity: "",
      country: "",
      dob: new Date(),
      emailConfirmed: true,
      branch: "branch1",
    };
  });

  describe("#placeOrder()", () => {
    it("should reject if order could not be updated with confirm true", (done) => {
      orderUpdate = false;

      orderPlacedHandler
        .placeOrder(testOrder, testAccessToken)
        .catch((err: BlError) => {
          expect(err.errorStack[0].getMsg()).to.be.eq("could not update order");

          done();
        });
    });

    it("should reject if paymentHandler.confirmPayments rejects", (done) => {
      paymentsConfirmed = false;

      orderPlacedHandler
        .placeOrder(testOrder, testAccessToken)
        .catch((err: BlError) => {
          expect(err.errorStack[0].getMsg()).to.be.eq(
            "could not confirm payments"
          );
          done();
        });
    });

    it("should reject if order.customer is not found", async () => {
      testOrder.customer = "notFoundUserDetails";

      try {
        await orderPlacedHandler.placeOrder(testOrder, testAccessToken);
      } catch (e) {
        return expect(e.errorStack[0].getMsg()).to.eq(
          'customer "notFoundUserDetails" not found'
        );
      }
    });

    it("should reject if userDetailStorage.updates rejects", (done) => {
      userDeatilUpdate = false;

      orderPlacedHandler
        .placeOrder(testOrder, testAccessToken)
        .catch((err: BlError) => {
          expect(err.errorStack[0].getMsg()).to.be.eq(
            "could not update userDetail with placed order"
          );
          done();
        });
    });

    //it('should reject if userDetail.emailConfirmed is false', (done) => {
    //testUserDetail.emailConfirmed = false;

    //orderPlacedHandler.placeOrder(testOrder, testAccessToken).catch((err: BlError) => {
    //expect(err.errorStack[0].getMsg())
    //.to.be.eq('userDetail.emailConfirmed is not true');
    //done();
    //})
    /*});*/

    it("should resolve when order was placed", () => {
      return expect(orderPlacedHandler.placeOrder(testOrder, testAccessToken))
        .to.be.fulfilled;
    });
  });
});
