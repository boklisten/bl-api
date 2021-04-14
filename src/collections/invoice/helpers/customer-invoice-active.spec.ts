// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, Invoice } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { CustomerInvoiceActive } from "./customer-invoice-active";
chai.use(chaiAsPromised);

describe("CustomerInvoiceActive", () => {
  const invoiceStorage = new BlDocumentStorage<Invoice>("invoices");
  const getInvoicesByQueryStub = sinon.stub(invoiceStorage, "getByQuery");
  const customerInvoiceActive = new CustomerInvoiceActive(invoiceStorage);
  const testUserId = "5f2aa6e8d39045001c444842";

  describe("haveActiveInvoices()", () => {
    it("should return false if no invoices was found for customer", () => {
      getInvoicesByQueryStub.rejects(new BlError("not found").code(702));

      return expect(customerInvoiceActive.haveActiveInvoices(testUserId)).to
        .eventually.be.false;
    });

    it("should return false if invoices was found but none was active", () => {
      const inactiveInvoice: Invoice = {
        id: "invoice1",
        duedate: new Date(),
        customerHavePayed: true,
        toDebtCollection: false,
        toCreditNote: false,
        customerItemPayments: [],
        customerInfo: null,
        payment: null,
      };

      const inactiveInvoice2: Invoice = {
        id: "invoice2",
        duedate: new Date(),
        customerHavePayed: false,
        toDebtCollection: false,
        toCreditNote: true,
        customerItemPayments: [],
        customerInfo: null,
        payment: null,
      };

      getInvoicesByQueryStub.resolves([inactiveInvoice, inactiveInvoice2]);

      return expect(customerInvoiceActive.haveActiveInvoices(testUserId)).to
        .eventually.be.false;
    });

    it("should return true if invoices was found and at least one was active", () => {
      const inactiveInvoice: Invoice = {
        id: "invoice1",
        duedate: new Date(),
        customerHavePayed: true,
        toDebtCollection: false,
        toCreditNote: false,
        customerItemPayments: [],
        customerInfo: null,
        payment: null,
      };

      const inactiveInvoice2: Invoice = {
        id: "invoice2",
        duedate: new Date(),
        customerHavePayed: false,
        toDebtCollection: false,
        toCreditNote: false,
        customerItemPayments: [],
        customerInfo: null,
        payment: null,
      };

      getInvoicesByQueryStub.resolves([inactiveInvoice, inactiveInvoice2]);

      return expect(customerInvoiceActive.haveActiveInvoices(testUserId)).to
        .eventually.be.true;
    });
  });
});
