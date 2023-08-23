// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { OrderToCustomerItemGenerator } from "../../../customer-item/helpers/order-to-customer-item-generator";
import { OrderPlaceOperation } from "./order-place.operation";
import { BlError, CustomerItem, Match, Order } from "@boklisten/bl-model";
import { OrderPlacedHandler } from "../../helpers/order-placed-handler/order-placed-handler";
import { OrderValidator } from "../../helpers/order-validator/order-validator";
import { BlCollectionName } from "../../../bl-collection";

chai.use(chaiAsPromised);

describe("OrderPlaceOperation", () => {
  const resHandler = new SEResponseHandler();
  const orderStorage = new BlDocumentStorage<Order>(BlCollectionName.Orders);
  const orderToCustomerItemGenerator = new OrderToCustomerItemGenerator();
  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    BlCollectionName.CustomerItems
  );
  const matchesStorage = new BlDocumentStorage<Match>(BlCollectionName.Matches);
  const orderPlacedHandler = new OrderPlacedHandler();
  const orderValidator = new OrderValidator();

  const orderPlaceOperation = new OrderPlaceOperation(
    resHandler,
    orderToCustomerItemGenerator,
    orderStorage,
    customerItemStorage,
    orderPlacedHandler,
    orderValidator,
    undefined,
    matchesStorage
  );

  const placeOrderStub = sinon.stub(orderPlacedHandler, "placeOrder");
  const sendResponseStub = sinon.stub(resHandler, "sendResponse");
  const getOrderStub = sinon.stub(orderStorage, "get");
  const getCustomerItemStub = sinon.stub(customerItemStorage, "get");
  const getManyCustomerItemsStub = sinon.stub(customerItemStorage, "getMany");
  const generateCustomerItemStub = sinon.stub(
    orderToCustomerItemGenerator,
    "generate"
  );
  const validateOrderStub = sinon.stub(orderValidator, "validate");
  const getAllMatchesStub = sinon.stub(matchesStorage, "getAll");

  describe("run()", () => {
    beforeEach(() => {
      placeOrderStub.reset();
      sendResponseStub.reset();
      getOrderStub.reset();
      getCustomerItemStub.reset();
      getManyCustomerItemsStub.reset();
      generateCustomerItemStub.reset();
      validateOrderStub.reset();
      getAllMatchesStub.reset();
    });

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
          blid: "blid1",
          taxRate: 0,
          taxAmount: 0,
          handout: true,
          info: {},
          delivered: false,
          customerItem: "customerItem1",
        },
      ],
      branch: "branch1",
      customer: "customer1",
      byCustomer: false,
      employee: "employee1",
      placed: false,
      payments: ["payment1"],
      delivery: "delivery1",
    };

    it("should reject if order is not found", () => {
      getOrderStub.rejects(new BlError('order "randomOrder" not found'));

      return expect(
        orderPlaceOperation.run({ documentId: "randomOrder" })
      ).to.eventually.be.rejectedWith(/order "randomOrder" not found/);
    });

    it("should reject if orderPlacedHandler.placeOrder rejects", () => {
      getOrderStub.resolves(validOrder);
      placeOrderStub.rejects(new BlError("order could not be placed"));
      getAllMatchesStub.resolves([]);
      getManyCustomerItemsStub.resolves([]);

      return expect(
        orderPlaceOperation.run({
          documentId: validOrder.id,
          user: { id: "user1", permission: "admin" },
        })
      ).to.eventually.be.rejectedWith(/order could not be placed/);
    });

    it("should reject if orderValidator.validate rejects", () => {
      getOrderStub.resolves(validOrder);
      placeOrderStub.resolves(true);
      validateOrderStub.rejects(new BlError("order not valid!"));
      getAllMatchesStub.resolves([]);
      getManyCustomerItemsStub.resolves([]);

      return expect(
        orderPlaceOperation.run({
          documentId: validOrder.id,
          user: { id: "user1", permission: "admin" },
        })
      ).to.eventually.be.rejectedWith(/order not valid/);
    });

    it("should resolve if order is valid", async () => {
      getAllMatchesStub.resolves([]);
      getManyCustomerItemsStub.resolves([]);
      const order = {
        id: "validOrder1",
        customer: "customer1",
        amount: 100,
        orderItems: [
          {
            type: "buy",
            amount: 100,
          },
        ],
      };

      getOrderStub.resolves(order);
      generateCustomerItemStub.resolves([]);
      placeOrderStub.resolves(true);
      validateOrderStub.resolves(true);

      let result;

      try {
        result = await orderPlaceOperation.run({
          documentId: validOrder.id,
          user: { id: "user1", permission: "admin" },
        });
      } catch (e) {
        return expect(e).to.be.false;
        //throw e;
      }

      expect(result).to.be.true;
    });
  });
});
