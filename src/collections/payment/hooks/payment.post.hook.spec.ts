// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { Payment, Order, BlError, AccessToken } from "@boklisten/bl-model";
import { PaymentPostHook } from "./payment.post.hook";
import { PaymentValidator } from "../helpers/payment.validator";
import { PaymentDibsHandler } from "../helpers/dibs/payment-dibs-handler";

chai.use(chaiAsPromised);

describe("PaymentPostHook", () => {
  const paymentValidator = new PaymentValidator();
  const orderStorage = new BlDocumentStorage<Order>("orders");
  const paymentStorage: BlDocumentStorage<Payment> = new BlDocumentStorage(
    "payments"
  );
  const paymentDibsHandler = new PaymentDibsHandler();
  const paymentPostHook = new PaymentPostHook(
    paymentStorage,
    orderStorage,
    paymentValidator,
    paymentDibsHandler
  );

  let testOrder: Order;
  let testPayment: Payment;
  let testAccessToken;
  let paymentValidated: boolean;
  let handleDibsPaymentValid: boolean;

  beforeEach(() => {
    testOrder = {
      id: "order1",
      amount: 100,
      orderItems: [],
      branch: "branch1",
      customer: "customer1",
      byCustomer: true,
      payments: [],
    };

    testPayment = {
      id: "payment1",
      method: "later",
      order: "order1",
      amount: 0,
      customer: "customer1",
      branch: "branch1",
    };

    testAccessToken = {
      sub: "user1",
      permission: "customer",
    };

    paymentValidated = true;
    handleDibsPaymentValid = true;
  });

  sinon.stub(paymentStorage, "get").callsFake((id: string) => {
    if (id !== testPayment.id) {
      return Promise.reject(new BlError("not found").code(702));
    }

    return Promise.resolve(testPayment);
  });

  sinon
    .stub(paymentStorage, "update")
    .callsFake((id: string, data: any, accessToken: AccessToken) => {
      return Promise.resolve(testPayment);
    });

  sinon
    .stub(paymentDibsHandler, "handleDibsPayment")
    .callsFake((payment, accessToken) => {
      if (!handleDibsPaymentValid) {
        return Promise.reject(new BlError("could not create dibs payment"));
      }
      return Promise.resolve(testPayment);
    });

  sinon.stub(orderStorage, "get").callsFake((id: string) => {
    if (id !== testOrder.id) {
      return Promise.reject(new BlError("not found").code(702));
    }

    return Promise.resolve(testOrder);
  });

  const orderStorageUpdateStub = sinon
    .stub(orderStorage, "update")
    .callsFake((id: string, data: any) => {
      return Promise.resolve(testOrder);
    });

  sinon.stub(paymentValidator, "validate").callsFake(() => {
    if (!paymentValidated) {
      return Promise.reject(new BlError("could not validate payment"));
    }

    return Promise.resolve(true);
  });

  describe("#before()", () => {});

  describe("#after()", () => {
    it("should reject if ids is empty or undefined", () => {
      return expect(
        paymentPostHook.after([], testAccessToken)
      ).to.eventually.be.rejectedWith(
        BlError,
        /payments is empty or undefined/
      );
    });

    it("should reject if accessToken is undefined", () => {
      return expect(
        paymentPostHook.after([testPayment], undefined)
      ).to.be.rejectedWith(BlError, /accessToken is undefined/);
    });

    it("should reject if paymentValidator.validate rejects", () => {
      paymentValidated = false;

      return expect(
        paymentPostHook.after([testPayment], testAccessToken)
      ).to.be.rejectedWith(BlError, /payment could not be validated/);
    });

    context('when paymentMethod is "dibs"', () => {
      beforeEach(() => {
        testPayment.method = "dibs";
      });

      it("should reject if paymentDibsHandler.handleDibsPayment rejects", () => {
        handleDibsPaymentValid = false;

        return expect(
          paymentPostHook.after([testPayment], testAccessToken)
        ).to.be.rejectedWith(BlError, /could not create dibs payment/);
      });
    });
  });
});
