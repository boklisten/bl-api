// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { expect } from "chai";
import { BlError, Delivery, Order } from "@boklisten/bl-model";
import { DibsPaymentService } from "./dibs-payment.service";
import { DibsEasyOrder } from "./dibs-easy-order/dibs-easy-order";
import { HttpHandler } from "../../http/http.handler";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";

chai.use(chaiAsPromised);

describe("DibsPaymentService", () => {
  const httpHandler = new HttpHandler();
  const deliveryStorage = new BlDocumentStorage<Delivery>("deliveries");
  const dibsPaymentService: DibsPaymentService = new DibsPaymentService(
    deliveryStorage,
    httpHandler
  );
  let testOrder: Order;
  let testDibsEasyOrder: DibsEasyOrder;
  const testUser = {} as any;

  beforeEach(() => {
    testOrder = {
      id: "o1",
      amount: 100,
      customer: "",
      byCustomer: true,
      branch: "b1",
      orderItems: [
        {
          type: "rent",
          title: "Signatur 3",
          amount: 100,
          unitPrice: 100,
          taxRate: 0,
          taxAmount: 0,
          item: "i1",
        },
      ],
      payments: [],
      comments: [],
      delivery: "",
      active: false,
      user: {
        id: "u1",
      },
      lastUpdated: new Date(),
      creationTime: new Date(),
    };

    testDibsEasyOrder = {
      order: {
        items: [
          {
            reference: "i1",
            name: "Signatur 3",
            quantity: 1,
            unit: "book",
            unitPrice: 1000,
            taxRate: 0,
            taxAmount: 0,
            grossTotalAmount: 1000,
            netTotalAmount: 1000,
          },
        ],
        amount: 1000,
        currency: "NOK",
        reference: "o1",
      },
      checkout: {
        url: "",
        termsUrl: "",
        ShippingCountries: [{ countryCode: "NOR" }],
      },
    };
  });

  describe("#orderToDibsEasyOrder", () => {
    it("should throw error if order.id is not defined", () => {
      testOrder.id = null;

      expect(() => {
        dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);
      }).to.throw(BlError, /order.id is not defined/);
    });

    it('should throw error if order.payments include more than one payment with method "dibs"', () => {});

    it('should throw error if none of the order.payments is of type "dibs"', () => {});

    it("should throw error if order.amount is 0", () => {
      testOrder.amount = 0;
      expect(() => {
        dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);
      }).to.throw(BlError, /order.amount is zero/);
    });

    it("should throw error if order.byCustomer = false", () => {
      testOrder.byCustomer = false;
      expect(() => {
        dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);
      }).to.throw(BlError, /order.byCustomer is false/);
    });

    it("should return a total amount of 10000 when item costs 100kr", () => {
      testOrder.orderItems[0].amount = 100;
      testOrder.orderItems[0].unitPrice = 100;
      let deo: DibsEasyOrder = dibsPaymentService.orderToDibsEasyOrder(
        testUser,
        testOrder
      );

      expect(deo.order.amount).to.eql(10000);
    });

    it('should return a dibsEasyOrder.reference equal to "103"', () => {
      testOrder.id = "103";
      let deo: DibsEasyOrder = dibsPaymentService.orderToDibsEasyOrder(
        testUser,
        testOrder
      );
      expect(deo.order.reference).to.eql("103");
    });

    context("dibsEasyOrder.items should be valid", () => {
      it('should have name of "signatur 3"', () => {
        const title = "signatur 3";
        testOrder.orderItems[0].title = title;

        let deo = dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);

        expect(deo.order.items[0].name).to.eql(title);
      });

      it("should have grossTotalAmount of 15000", () => {
        testOrder.orderItems[0].amount = 150;
        testOrder.orderItems[0].unitPrice = 150;
        testOrder.amount = 150;
        let deo = dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);

        expect(deo.order.items[0].grossTotalAmount).to.eql(15000);
      });

      it("should have taxAmount equal to 5000", () => {
        testOrder.orderItems[0].unitPrice = 100;
        testOrder.orderItems[0].taxRate = 0.5;
        testOrder.orderItems[0].taxAmount = 50;

        let deo = dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);

        expect(deo.order.items[0].taxAmount).to.eql(5000);
      });

      it("should have taxRate equal to 2500", () => {
        testOrder.orderItems[0].unitPrice = 100;
        testOrder.orderItems[0].taxRate = 0.25;

        let deo = dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);

        expect(deo.order.items[0].taxRate).to.eql(2500);
      });
    });

    context("dibsEasyOrder should be valid", () => {
      it("should have reference equal to the order.id", () => {
        testOrder.id = "orderId1";

        let deo = dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);

        expect(deo.order.reference).to.eql(testOrder.id);
      });

      it("should have items.length equal to the number of items in order", () => {
        let deo = dibsPaymentService.orderToDibsEasyOrder(testUser, testOrder);

        expect(deo.order.items.length).to.eql(testOrder.orderItems.length);
      });
    });
  });

  let testDibsEasyPaymentResponse: any;
  let httpHandlerGetSuccess: boolean;

  beforeEach(() => {
    testDibsEasyPaymentResponse = {
      payment: {
        paymentId: "dibsPaymentId1",
      },
    };

    httpHandlerGetSuccess = true;
  });

  sinon
    .stub(httpHandler, "get")
    .callsFake((url: string, authorization?: string) => {
      if (!httpHandlerGetSuccess) {
        return Promise.reject(new BlError("could not get resource"));
      }

      return Promise.resolve(testDibsEasyPaymentResponse);
    });

  describe("#fetchDibsPaymentData", () => {
    it("should reject if httpHandler rejects", () => {
      httpHandlerGetSuccess = false;
      return expect(
        dibsPaymentService.fetchDibsPaymentData("dibsPaymentId1")
      ).to.be.rejectedWith(
        BlError,
        /could not get payment details for paymentId "dibsPaymentId1"/
      );
    });

    it("should reject if dibsResponse does not include a payment", (done) => {
      testDibsEasyPaymentResponse = {
        somethingElse: true,
      };

      dibsPaymentService
        .fetchDibsPaymentData("dibsPaymentId1")
        .catch((err: BlError) => {
          expect(err.errorStack[0].getMsg()).to.be.eq(
            "dibs response did not include payment information"
          );
          done();
        });
    });

    it("should resolve with a dibsEasyPayment object with correct paymentId", () => {
      testDibsEasyPaymentResponse = {
        payment: {
          paymentId: "aPaymentId",
        },
      };

      return expect(
        dibsPaymentService.fetchDibsPaymentData("aPaymentId")
      ).to.eventually.be.eql({ paymentId: "aPaymentId" });
    });
  });
});
