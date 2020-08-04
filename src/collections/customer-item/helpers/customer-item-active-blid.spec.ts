import "mocha";
import * as chai from "chai";
import * as sinon from "sinon";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import {
  BlError,
  Branch,
  CustomerItem,
  Order,
  OrderItem,
  UserDetail
} from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { CustomerItemActiveBlid } from "./customer-item-active-blid";
chai.use(chaiAsPromised);

describe("CustomerItemActiveBlid", () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    "customeritems"
  );

  const getByQueryCustomerItemStub = sinon.stub(
    customerItemStorage,
    "getByQuery"
  );

  const customerItemActiveBlid = new CustomerItemActiveBlid(
    customerItemStorage
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
        returned: false
      };

      const customerItem2 = {
        id: "customerItem2",
        item: "item2",
        blid: "blid1",
        customer: "customer2",
        deadline: new Date(),
        handout: true,
        returned: true
      };

      getByQueryCustomerItemStub.resolves([customerItem1, customerItem2]);

      return expect(
        customerItemActiveBlid.getActiveCustomerItems("blid1")
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
        returned: true
      };

      getByQueryCustomerItemStub.resolves([customerItem]);

      return expect(
        customerItemActiveBlid.getActiveCustomerItems("blid1")
      ).eventually.be.eql([]);
    });
  });
});
