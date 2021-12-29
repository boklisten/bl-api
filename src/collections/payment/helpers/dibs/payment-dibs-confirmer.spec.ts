// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { AccessToken, BlError, Order, Payment } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { PaymentDibsConfirmer } from "./payment-dibs-confirmer";
import { DibsPaymentService } from "../../../../payment/dibs/dibs-payment.service";
import { DibsEasyPayment } from "../../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import { UserDetailHelper } from "../../../user-detail/helpers/user-detail.helper";
chai.use(chaiAsPromised);

describe("PaymentDibsConfirmer", () => {
  const dibsPaymentService = new DibsPaymentService();
  const dibsPaymentFetchStub = sinon.stub(
    dibsPaymentService,
    "fetchDibsPaymentData"
  );
  const paymentStorage = new BlDocumentStorage<Payment>("payments");
  const paymentDibsConfirmer = new PaymentDibsConfirmer(
    dibsPaymentService,
    paymentStorage
  );

  const updatePaymentStub = sinon.stub(paymentStorage, "update");

  const accessToken = {} as AccessToken;

  beforeEach(() => {
    dibsPaymentFetchStub.reset();
    updatePaymentStub.reset();
  });

  describe("confirm()", () => {
    it("should reject if payment.info.paymentId is not defined", () => {
      const payment = { id: "payment1" } as Payment;
      const order = { payments: [payment.id] } as Order;

      return expect(
        paymentDibsConfirmer.confirm(order, payment, accessToken)
      ).to.eventually.be.rejectedWith(
        BlError,
        /payment.info.paymentId is undefined/
      );
    });

    it("should reject if dibsPaymentService.fetchDibsPaymentData rejects", () => {
      dibsPaymentFetchStub.rejects(
        new BlError("did not find dibs payment data")
      );

      const payment = {
        id: "payment1",
        info: { paymentId: "dibs1" },
      } as Payment;
      const order = { payments: [payment.id] } as Order;

      return expect(
        paymentDibsConfirmer.confirm(order, payment, accessToken)
      ).to.eventually.be.rejectedWith(
        BlError,
        /could not get dibs payment from dibs api/
      );
    });

    it("should reject if dibsEasyPaymentDetails.orderDetails.reference is undefiend", () => {
      dibsPaymentFetchStub.resolves({ orderDetails: { amount: "100" } });

      const payment = {
        id: "payment1",
        info: { paymentId: "dibs1" },
      } as Payment;
      const order = { id: "order1", payments: [payment.id] } as Order;

      return expect(
        paymentDibsConfirmer.confirm(order, payment, accessToken)
      ).to.eventually.be.rejectedWith(
        BlError,
        /dibsEasyPaymentDetails.orderDetails.reference is not equal to order.id/
      );
    });

    it("should reject if paymentStorage.update rejects", () => {
      dibsPaymentFetchStub.resolves({
        orderDetails: { amount: "12000", reference: "order1" },
        summary: { reservedAmount: "12000" },
      });

      const payment = {
        id: "payment1",
        info: { paymentId: "dibs1" },
        amount: 120,
      } as Payment;

      const order = {
        id: "order1",
        amount: 120,
        payments: [payment.id],
      } as Order;

      updatePaymentStub.rejects(new BlError("could not update payment"));

      return expect(
        paymentDibsConfirmer.confirm(order, payment, accessToken)
      ).to.eventually.be.rejectedWith(
        BlError,
        /payment could not be updated with dibs information/
      );
    });

    it("should reject if dibsEasyPaymentDetails.summary.reservedAmount is not equal to order.amount", () => {
      dibsPaymentFetchStub.resolves({
        orderDetails: { amount: "10000", reference: "order1" },
        summary: { reservedAmount: "10000" },
      });

      const payment = {
        id: "payment1",
        info: { paymentId: "dibs1" },
        amount: 110,
      } as Payment;

      const order = {
        id: "order1",
        amount: 110,
        payments: [payment.id],
      } as Order;

      return expect(
        paymentDibsConfirmer.confirm(order, payment, accessToken)
      ).to.eventually.be.rejectedWith(
        BlError,
        /dibsEasyPaymentDetails.summary.reservedAmount "10000" is not equal to payment.amount "11000"/
      );
    });

    it("should resolve if payment is valid", () => {
      dibsPaymentFetchStub.resolves({
        orderDetails: { amount: "12000", reference: "order1" },
        summary: { reservedAmount: "12000" },
      });

      updatePaymentStub.resolves(true);

      const payment = {
        id: "payment1",
        info: { paymentId: "dibs1" },
        amount: 120,
      } as Payment;

      const order = {
        id: "order1",
        amount: 120,
        payments: [payment.id],
      } as Order;

      return expect(paymentDibsConfirmer.confirm(order, payment, accessToken))
        .to.eventually.be.true;
    });
  });

  /*

      it('should update payment with confirmed true if dibsEasyPayment is valid', done => {
        testPayment1.confirmed = false;

        paymentHandler
          .confirmPayments(testOrder, testAccessToken)
          .then((payments: Payment[]) => {
            expect(payments[0].confirmed).to.be.true;
            done();
          });
      });

      */
});
