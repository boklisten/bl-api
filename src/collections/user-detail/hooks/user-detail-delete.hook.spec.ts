import "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import * as sinon from "sinon";
import { BlError, AccessToken, UserDetail } from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { OrderActive } from "../../order/helpers/order-active/order-active";
import { UserDetailDeleteHook } from "./user-detail-delete.hook";
chai.use(chaiAsPromised);
import { CustomerHaveActiveCustomerItems } from "../../customer-item/helpers/customer-have-active-customer-items";
import { CustomerInvoiceActive } from "../../invoice/helpers/customer-invoice-active";
import { UserCanDeleteUserDetail } from "../helpers/user-can-delete-user-detail";

describe("UserDetailDeleteHook", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");
  const customerHaveActiveCustomerItems = new CustomerHaveActiveCustomerItems();
  const haveActiveCustomerItemsStub = sinon.stub(
    customerHaveActiveCustomerItems,
    "haveActiveCustomerItems"
  );

  const testUserId = "5c88070b83d0da001a4ea01d";

  const orderActive = new OrderActive();
  const haveActiveOrdersStub = sinon.stub(orderActive, "haveActiveOrders");
  const customerInvoiceActive = new CustomerInvoiceActive();
  const haveActiveInvoicesStub = sinon.stub(
    customerInvoiceActive,
    "haveActiveInvoices"
  );
  const userCanDeleteUserDetail = new UserCanDeleteUserDetail();
  const canDeleteStub = sinon.stub(userCanDeleteUserDetail, "canDelete");
  const userDetailDeleteHook = new UserDetailDeleteHook(
    orderActive,
    customerHaveActiveCustomerItems,
    customerInvoiceActive,
    userCanDeleteUserDetail
  );

  beforeEach(() => {
    haveActiveOrdersStub.reset();
    haveActiveCustomerItemsStub.reset();
    haveActiveCustomerItemsStub.reset();
    canDeleteStub.reset();
  });

  describe("before()", () => {
    it("should reject if customer has active orders", () => {
      haveActiveOrdersStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: ""
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId)
      ).to.eventually.be.rejectedWith(BlError, /have active orders/);
    });

    it("should reject if customer has active customer-items", () => {
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: ""
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId)
      ).to.eventually.be.rejectedWith(BlError, /have active customer-items/);
    });

    it("should reject if customer has active invoices", () => {
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(false);
      haveActiveInvoicesStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: ""
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId)
      ).to.eventually.be.rejectedWith(BlError, /have active invoices/);
    });

    it("should reject if you does not have the permission to delete the user", () => {
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(false);
      haveActiveInvoicesStub.resolves(false);
      canDeleteStub.resolves(false);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: "user1"
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId)
      ).to.eventually.be.rejectedWith(BlError, /no permission to delete user/);
    });

    it("should resolve with true if user can be deleted", () => {
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(false);
      haveActiveInvoicesStub.resolves(false);
      canDeleteStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: "user1"
      } as AccessToken;

      return expect(userDetailDeleteHook.before({}, accessToken, testUserId)).to
        .eventually.be.true;
    });
  });
});
