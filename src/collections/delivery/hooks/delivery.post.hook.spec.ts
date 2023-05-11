// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import {
  BlError,
  Delivery,
  Item,
  Order,
  AccessToken,
} from "@boklisten/bl-model";
import { deliverySchema } from "../delivery.schema";
import { orderSchema } from "../../order/order.schema";
import { itemSchema } from "../../item/item.schema";
import { DeliveryPostHook } from "./delivery.post.hook";
import { DeliveryValidator } from "../helpers/deliveryValidator/delivery-validator";
import { DeliveryHandler } from "../helpers/deliveryHandler/delivery-handler";
import { BlCollectionName } from "../../bl-collection";

chai.use(chaiAsPromised);

describe("DeliveryPostHook", () => {
  const deliveryStorage = new BlDocumentStorage<Delivery>(
    BlCollectionName.Deliveries,
    deliverySchema
  );
  const orderStorage = new BlDocumentStorage<Order>(
    BlCollectionName.Orders,
    orderSchema
  );
  const itemStorage = new BlDocumentStorage<Item>(
    BlCollectionName.Items,
    itemSchema
  );
  const deliveryValidator = new DeliveryValidator();
  const deliveryHandler = new DeliveryHandler();
  const deliveryPostHook = new DeliveryPostHook(
    deliveryValidator,
    deliveryHandler,
    deliveryStorage,
    orderStorage,
    itemStorage
  );

  let testDelivery: Delivery;
  let testOrder: Order;
  let testItem: Item;
  let testAccessToken: AccessToken;
  let orderUpdated = true;

  let deliveryValidated = true;

  beforeEach(() => {
    orderUpdated = true;
    deliveryValidated = true;

    testDelivery = {
      id: "delivery1",
      method: "bring",
      amount: 100,
      order: "order1",
      info: {
        branch: "branch1",
      },
    };

    testAccessToken = {
      iss: "boklisten.co",
      aud: "boklisten.co",
      iat: 1234,
      exp: 2345,
      sub: "user1",
      username: "a@b.com",
      permission: "customer",
      details: "details1",
    };

    testItem = {
      id: "item1",
      title: "signatur 3",
      type: "book",
      price: 100,
      taxRate: 0,
    };

    testOrder = {
      id: "order1",
      customer: "customer1",
      amount: 100,
      byCustomer: true,
      branch: "branch1",
      orderItems: [
        {
          item: "item1",
          title: "signatur 3",
          amount: 100,
          unitPrice: 100,
          taxAmount: 0,
          taxRate: 0,
          type: "buy",
        },
      ],
      payments: [],
      delivery: "",
    };
  });

  sinon
    .stub(deliveryValidator, "validate")
    .callsFake((delivery: Delivery, order: Order) => {
      if (!deliveryValidated) {
        return Promise.reject(new BlError("delivery could not be validated"));
      }
      return Promise.resolve(true);
    });

  sinon
    .stub(deliveryHandler, "updateOrderBasedOnMethod")
    .callsFake((delivery: Delivery, order: Order, accessToken: AccessToken) => {
      if (!orderUpdated) {
        return Promise.reject(new BlError("order could not be updated"));
      }
      return Promise.resolve(order);
    });

  sinon.stub(deliveryStorage, "get").callsFake((id: string) => {
    return new Promise((resolve, reject) => {
      if (id === "delivery1") {
        return resolve(testDelivery);
      }
      return reject(new BlError("not found").code(702));
    });
  });

  sinon.stub(orderStorage, "get").callsFake((id: string) => {
    return new Promise((resolve, reject) => {
      if (id === "order1") {
        return resolve(testOrder);
      }
      return reject(new BlError("not found").code(702));
    });
  });

  sinon.stub(itemStorage, "getMany").callsFake((ids: string[]) => {
    return new Promise((resolve, reject) => {
      if (ids[0] === "item1") {
        return resolve(testItem);
      }
      return reject(new BlError("not found").code(702));
    });
  });

  describe("#after()", () => {
    it("should reject if deliveryIds is empty or undefined", (done) => {
      deliveryPostHook.after([]).catch((blError) => {
        expect(blError.getMsg()).to.contain("deliveries is empty or undefined");
        done();
      });
    });

    it("should reject if delivery.order is not found", (done) => {
      testDelivery.order = "notFoundOrder";

      deliveryPostHook
        .after([testDelivery], testAccessToken)
        .catch((blError: BlError) => {
          expect(blError.getCode()).to.be.eql(702);

          expect(blError.getMsg()).to.contain(`not found`);

          done();
        });
    });

    it("should reject if deliveryValidator.validate rejects", () => {
      deliveryValidated = false;

      return expect(
        deliveryPostHook.after([testDelivery], testAccessToken)
      ).to.be.rejectedWith(BlError, /delivery could not be validated/);
    });

    it("should reject if DeliveryHandler.updateOrderBasedOnMethod rejects", () => {
      orderUpdated = false;

      return expect(
        deliveryPostHook.after([testDelivery], testAccessToken)
      ).to.be.rejectedWith(BlError, /order could not be updated/);
    });
  });
});
