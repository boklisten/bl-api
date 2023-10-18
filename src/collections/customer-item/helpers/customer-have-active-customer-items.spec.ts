import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, CustomerItem } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { CustomerHaveActiveCustomerItems } from "./customer-have-active-customer-items";
import { BlCollectionName } from "../../bl-collection";
chai.use(chaiAsPromised);

describe("CustomerHaveActiveCustomerItems", () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    BlCollectionName.CustomerItems,
  );

  const customerItemByQueryStub = sinon.stub(customerItemStorage, "getByQuery");

  const customerHaveActiveCustomerItems = new CustomerHaveActiveCustomerItems(
    customerItemStorage,
  );

  const testUserId = "5d765db5fc8c47001c408d8d";

  beforeEach(() => {
    customerItemByQueryStub.reset();
  });

  describe("haveActiveCustomerItems()", () => {
    it("should resolve with false if no customerItems is found", () => {
      customerItemByQueryStub.rejects(new BlError("not found").code(702));

      return expect(
        customerHaveActiveCustomerItems.haveActiveCustomerItems(testUserId),
      ).to.eventually.be.false;
    });

    it("should resolve with false if no customerItems was active", () => {
      const nonActiveCustomerItem: CustomerItem = {
        id: "customerItem1",
        item: "item1",
        deadline: new Date(),
        customer: testUserId,
        handout: true,
        returned: true,
      };

      customerItemByQueryStub.resolves([nonActiveCustomerItem]);

      return expect(
        customerHaveActiveCustomerItems.haveActiveCustomerItems(testUserId),
      ).to.eventually.be.false;
    });

    it("should resolve with true if at least one customerItem was active", () => {
      const nonActiveCustomerItem: CustomerItem = {
        id: "customerItem1",
        item: "item1",
        deadline: new Date(),
        customer: testUserId,
        handout: true,
        returned: true,
      };

      const activeCustomerItem: CustomerItem = {
        id: "customerItem1",
        item: "item1",
        deadline: new Date(),
        customer: testUserId,
        handout: true,
        returned: false,
      };

      customerItemByQueryStub.resolves([
        nonActiveCustomerItem,
        activeCustomerItem,
      ]);

      return expect(
        customerHaveActiveCustomerItems.haveActiveCustomerItems(testUserId),
      ).to.eventually.be.true;
    });
  });
});
