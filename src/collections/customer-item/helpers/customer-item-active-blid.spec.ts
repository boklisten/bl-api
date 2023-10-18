import "mocha";
import chai from "chai";
import sinon from "sinon";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { CustomerItem } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { CustomerItemActiveBlid } from "./customer-item-active-blid";
import { BlCollectionName } from "../../bl-collection";
chai.use(chaiAsPromised);

describe("CustomerItemActiveBlid", () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    BlCollectionName.CustomerItems,
  );

  const getByQueryCustomerItemStub = sinon.stub(
    customerItemStorage,
    "getByQuery",
  );

  const customerItemActiveBlid = new CustomerItemActiveBlid(
    customerItemStorage,
  );

  beforeEach(() => {
    getByQueryCustomerItemStub.reset();
  });

  describe("isActive()", () => {
    it("should resolve true if one customerItem is active", () => {
      const customerItem1 = {
        id: "customerItem1",
        item: "item1",
        blid: "blid1",
        customer: "customer1",
        deadline: new Date(),
        handout: true,
        returned: false,
      };

      const customerItem2 = {
        id: "customerItem2",
        item: "item2",
        blid: "blid1",
        customer: "customer2",
        deadline: new Date(),
        handout: true,
        returned: true,
      };

      getByQueryCustomerItemStub.resolves([customerItem1, customerItem2]);

      return expect(
        customerItemActiveBlid.getActiveCustomerItemIds("blid1"),
      ).eventually.be.eql(["customerItem1"]);
    });

    it("should resolve false if no customerItem is active", () => {
      const customerItem = {
        id: "customerItem1",
        item: "item1",
        blid: "blid1",
        customer: "customer1",
        deadline: new Date(),
        handout: true,
        returned: true,
      };

      getByQueryCustomerItemStub.resolves([customerItem]);

      return expect(
        customerItemActiveBlid.getActiveCustomerItemIds("blid1"),
      ).eventually.be.eql([]);
    });
  });
});
