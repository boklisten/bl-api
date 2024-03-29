import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, AccessToken, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { OrderActive } from "../../order/helpers/order-active/order-active";
import { UserDetailDeleteHook } from "./user-detail-delete.hook";
import { CustomerHaveActiveCustomerItems } from "../../customer-item/helpers/customer-have-active-customer-items";
import { CustomerInvoiceActive } from "../../invoice/helpers/customer-invoice-active";
import { UserCanDeleteUserDetail } from "../helpers/user-can-delete-user-detail";
import { UserDeleteAllInfo } from "../helpers/user-delete-all-info";
import { BlCollectionName } from "../../bl-collection";
chai.use(chaiAsPromised);

describe("UserDetailDeleteHook", () => {
  new BlDocumentStorage<UserDetail>(BlCollectionName.UserDetails);
  const customerHaveActiveCustomerItems = new CustomerHaveActiveCustomerItems();
  const haveActiveCustomerItemsStub = sinon.stub(
    customerHaveActiveCustomerItems,
    "haveActiveCustomerItems",
  );

  const testUserId = "5c88070b83d0da001a4ea01d";

  const orderActive = new OrderActive();
  const haveActiveOrdersStub = sinon.stub(orderActive, "haveActiveOrders");
  const customerInvoiceActive = new CustomerInvoiceActive();
  const haveActiveInvoicesStub = sinon.stub(
    customerInvoiceActive,
    "haveActiveInvoices",
  );
  const userCanDeleteUserDetail = new UserCanDeleteUserDetail();
  const canDeleteStub = sinon.stub(userCanDeleteUserDetail, "canDelete");
  const userDeleteAllInfo = new UserDeleteAllInfo();
  const deleteAllInfoStub = sinon.stub(userDeleteAllInfo, "deleteAllInfo");

  const userDetailDeleteHook = new UserDetailDeleteHook(
    orderActive,
    customerHaveActiveCustomerItems,
    customerInvoiceActive,
    userCanDeleteUserDetail,
    userDeleteAllInfo,
  );

  beforeEach(() => {
    haveActiveOrdersStub.reset();
    haveActiveCustomerItemsStub.reset();
    haveActiveCustomerItemsStub.reset();
    canDeleteStub.reset();
    deleteAllInfoStub.reset();
  });

  describe("before()", () => {
    it("should reject if customer has active orders", () => {
      canDeleteStub.resolves(true);
      haveActiveOrdersStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: "",
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId),
      ).to.eventually.be.rejectedWith(BlError, /have active orders/);
    });

    it("should reject if customer has active customer-items", () => {
      canDeleteStub.resolves(true);
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: "",
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId),
      ).to.eventually.be.rejectedWith(BlError, /have active customer-items/);
    });

    it("should reject if customer has active invoices", () => {
      canDeleteStub.resolves(true);
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(false);
      haveActiveInvoicesStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: "",
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId),
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
        details: "user1",
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId),
      ).to.eventually.be.rejectedWith(BlError, /no permission to delete user/);
    });

    it("should reject if you does not have the permission to delete the user", () => {
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(false);
      haveActiveInvoicesStub.resolves(false);
      canDeleteStub.resolves(true);
      deleteAllInfoStub.rejects(new BlError("user info could not be deleted"));

      const accessToken = {
        iss: "",
        permission: "admin",
        details: "user1",
      } as AccessToken;

      return expect(
        userDetailDeleteHook.before({}, accessToken, testUserId),
      ).to.eventually.be.rejectedWith(
        BlError,
        /user info could not be deleted/,
      );
    });

    it("should resolve with true if user can be deleted", () => {
      haveActiveOrdersStub.resolves(false);
      haveActiveCustomerItemsStub.resolves(false);
      haveActiveInvoicesStub.resolves(false);
      canDeleteStub.resolves(true);
      deleteAllInfoStub.resolves(true);

      const accessToken = {
        iss: "",
        permission: "admin",
        details: "user1",
      } as AccessToken;

      return expect(userDetailDeleteHook.before({}, accessToken, testUserId)).to
        .eventually.be.true;
    });
  });
  describe("after()", () => {
    it("should resolve", () => {
      const accessToken = {
        permission: "admin",
        details: "user1",
      } as AccessToken;

      return expect(
        userDetailDeleteHook.after([], accessToken),
      ).to.eventually.be.eql([]);
    });
  });
});
