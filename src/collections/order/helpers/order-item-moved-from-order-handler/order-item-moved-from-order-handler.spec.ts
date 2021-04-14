// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, Order } from "@boklisten/bl-model";
import { OrderItemMovedFromOrderHandler } from "./order-item-moved-from-order-handler";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";

chai.use(chaiAsPromised);

describe("OrderItemMovedFromOrderHandler", () => {
  const orderStorage = new BlDocumentStorage<Order>("orders");
  const oiMovedFromOrderHandler = new OrderItemMovedFromOrderHandler(
    orderStorage
  );
  const getOrderStub = sinon.stub(orderStorage, "get");
  const updateOrderStub = sinon.stub(orderStorage, "update");

  describe("#updateOrderItems", () => {
    context('when "movedFromOrder" is present on order items', () => {
      const testMovedFromOrderId = "testMovedFromOrderId";

      const testMovedFromOrder = {
        amount: 100,
        orderItems: [
          {
            type: "rent",
            item: "item2",
            title: "Signatur 3: Tekstsammling",
            amount: 100,
            unitPrice: 100,
            taxRate: 0,
            taxAmount: 0,
            info: {
              from: new Date(),
              to: new Date(),
              numberOfPeriods: 1,
              periodType: "semester",
            },
          },
        ],
      };

      getOrderStub.withArgs(testMovedFromOrderId).resolves(testMovedFromOrder);

      const order = {
        id: "testOrder1",
        amount: 0,
        orderItems: [
          {
            type: "rent",
            item: "item2",
            title: "Signatur 3: Tekstsammling",
            amount: 0,
            unitPrice: 0,
            taxRate: 0,
            movedFromOrder: testMovedFromOrderId,
            taxAmount: 0,
            info: {
              from: new Date(),
              to: new Date(),
              numberOfPeriods: 1,
              periodType: "semester",
            },
          },
        ],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
      } as Order;

      it('should update the last orderItem with "movedToOrder"', (done) => {
        getOrderStub
          .withArgs(testMovedFromOrderId)
          .resolves(testMovedFromOrder);
        updateOrderStub.resolves(testMovedFromOrder);

        oiMovedFromOrderHandler
          .updateOrderItems(order)
          .then(() => {
            expect(updateOrderStub).to.have.been.called;
            done();
          })
          .catch((err) => {
            done(new Error(err));
          });
      });

      it('should reject if original order item already have "movedToOrder"', () => {
        testMovedFromOrder.orderItems[0]["movedToOrder"] = "anotherOrder";
        getOrderStub
          .withArgs(testMovedFromOrderId)
          .resolves(testMovedFromOrder);
        updateOrderStub.resolves(testMovedFromOrder);

        return expect(
          oiMovedFromOrderHandler.updateOrderItems(order)
        ).to.be.rejectedWith(
          BlError,
          /orderItem has "movedToOrder" already set/
        );
      });
    });
  });
});
