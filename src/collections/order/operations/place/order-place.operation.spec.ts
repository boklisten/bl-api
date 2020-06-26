import "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
chai.use(chaiAsPromised);
import * as sinon from "sinon";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { OrderToCustomerItemGenerator } from "../../../customer-item/helpers/order-to-customer-item-generator";
import { OrderPlaceOperation } from "./order-place.operation";
import { Order, BlError } from "@wizardcoder/bl-model";

describe("OrderPlaceOperation", () => {
  const resHandler = new SEResponseHandler();
  const orderStorage = new BlDocumentStorage<Order>("orders");
  const orderToCustomerItemGenerator = new OrderToCustomerItemGenerator();

  const orderPlaceOperation = new OrderPlaceOperation(
    resHandler,
    orderToCustomerItemGenerator,
    orderStorage
  );

  const validOrder = {
    id: "validOrder1",
    amount: 100,

    orderItems: [
      {
        type: "buy",
        item: "item1",
        title: "signatur 3",
        age: "new",
        amount: 100,
        uniPrice: 100,
        taxRate: 0,
        taxAmount: 0,
        handout: true,
        info: {},
        delivered: false,
        customerItem: "customerItem1"
      }
    ],
    branch: "branch1",
    customer: "customer1",
    byCustomer: false,
    employee: "employee1",
    placed: false,
    payments: ["payment1"],
    delivery: "delivery1"
  };

  sinon.stub(resHandler, "sendResponse").callsFake(() => {
    return true;
  });

  sinon.stub(orderStorage, "get").callsFake(id => {
    if (id == validOrder.id) {
      return Promise.resolve(validOrder);
    } else {
      return Promise.reject(new BlError("not found").code(702));
    }
  });

  sinon.stub(orderToCustomerItemGenerator, "generate").callsFake(() => {
    Promise.resolve([]);
  });

  describe("run()", () => {
    it("should reject if order is not found", () => {
      return expect(
        orderPlaceOperation.run({ documentId: "randomOrder" })
      ).to.eventually.be.rejectedWith(/order "randomOrder" not found/);
    });

    it("should resolve if order is valid", () => {
      const validOrder = {
        id: "order1",
        customer: "customer1",
        amount: 100,
        orderItems: [
          {
            type: "buy",
            amount: 100
          }
        ]
      };

      return expect(
        orderPlaceOperation.run({
          documentId: "order1",

          user: { id: "user1", permission: "admin" }
        })
      ).to.eventually.be.true;
    });
  });
});
