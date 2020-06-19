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

  const order = {
    id: "order1"
  };

  sinon.stub(resHandler, "sendResponse").callsFake(() => {
    return true;
  });

  sinon.stub(orderStorage, "get").callsFake(id => {
    if (id == order.id) {
      return Promise.resolve(order);
    } else {
      return Promise.reject(new BlError("not found").code(702));
    }
  });

  sinon.stub(orderToCustomerItemGenerator, "generate").callsFake(() => {
    Promise.resolve([]);
  });

  describe("run()", () => {
    const orderPlaceOperation = new OrderPlaceOperation(
      resHandler,
      orderToCustomerItemGenerator,
      orderStorage
    );

    it("should reject if order is not found", () => {
      return expect(
        orderPlaceOperation.run({ documentId: "randomOrder" })
      ).to.eventually.be.rejectedWith(/order "randomOrder" not found/);
    });

    it("should resolve", () => {
      return expect(orderPlaceOperation.run({ documentId: "order1" })).to
        .eventually.be.true;
    });
  });
});
