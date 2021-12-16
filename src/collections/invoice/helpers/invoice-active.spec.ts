// @ts-nocheck
import "mocha";
import { expect } from "chai";
import { Invoice } from "@boklisten/bl-model";
import { InvoiceActive } from "./invoice-active";

describe("InvoiceActive", () => {
  const invoiceActive = new InvoiceActive();

  describe("isActive()", () => {
    it("should return false if invoice is not active", () => {
      const nonActiveInvoices: Invoice[] = [
        {
          id: "invoice1",
          duedate: new Date(),
          customerHavePayed: true,
          toDebtCollection: false,
          toCreditNote: false,
          customerItemPayments: [],
          customerInfo: null,
          payment: null,
        },
        {
          id: "invoice1",
          duedate: new Date(),
          customerHavePayed: false,
          toDebtCollection: false,
          toCreditNote: true,
          customerItemPayments: [],
          customerInfo: null,
          payment: null,
        },
      ];

      for (const invoice of nonActiveInvoices) {
        expect(invoiceActive.isActive(invoice)).to.be.false;
      }
    });

    it("should return true if invoice is active", () => {
      const activeInvoices: Invoice[] = [
        {
          id: "invoice1",
          duedate: new Date(),
          customerHavePayed: false,
          toDebtCollection: false,
          toCreditNote: false,
          customerItemPayments: [],
          customerInfo: null,
          payment: null,
        },
        {
          id: "invoice1",
          duedate: new Date(),
          customerHavePayed: false,
          toDebtCollection: true,
          toCreditNote: false,
          customerItemPayments: [],
          customerInfo: null,
          payment: null,
        },
      ];

      for (const invoice of activeInvoices) {
        expect(invoiceActive.isActive(invoice)).to.be.true;
      }
    });
  });
});
