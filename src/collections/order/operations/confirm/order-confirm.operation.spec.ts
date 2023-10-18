import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { Order, BlError } from "@boklisten/bl-model";
import { OrderConfirmOperation } from "./order-confirm.operation";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";
import { BlCollectionName } from "../../../bl-collection";
chai.use(chaiAsPromised);

describe("OrderConfirmOperation", () => {
  const resHandler = new SEResponseHandler();
  const orderStorage = new BlDocumentStorage<Order>(BlCollectionName.Orders);
  const orderPlacedHandler = new OrderPlacedHandler();

  const orderGetStub = sinon.stub(orderStorage, "get");
  const orderPlaceStub = sinon.stub(orderPlacedHandler, "placeOrder");
  const sendResponseStub = sinon.stub(resHandler, "sendResponse");

  const orderConfirmOperation = new OrderConfirmOperation(
    resHandler,
    orderStorage,
    orderPlacedHandler,
  );

  beforeEach(() => {
    orderGetStub.reset();
    sendResponseStub.reset();
    orderPlaceStub.reset();
  });

  describe("run()", () => {
    it("should reject if order is not found", () => {
      orderGetStub.rejects(new BlError("not found").code(702));

      return expect(
        orderConfirmOperation.run({
          documentId: "order1",
          user: { id: "user1", permission: "customer", details: "" },
        }),
      ).to.eventually.be.rejectedWith(BlError, /order "order1" not found/);
    });
  });
});
