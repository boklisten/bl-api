// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, Branch, CustomerItem, OrderItem } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { CustomerItemHandler } from "./customer-item-handler";
import { SystemUser } from "../../../auth/permission/permission.service";
import { SEDbQuery } from "../../../query/se.db-query";
import mongoose from "mongoose";

chai.use(chaiAsPromised);

describe("CustomerItemHandler", () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    "customeritems"
  );
  const branchStorage = new BlDocumentStorage<Branch>("branches");
  const customerItemHandler = new CustomerItemHandler(
    customerItemStorage,
    branchStorage
  );

  const getCustomerItemStub = sinon.stub(customerItemStorage, "get");
  const getByQueryCustomerItemStub = sinon.stub(
    customerItemStorage,
    "getByQuery"
  );
  const updateCustomerItemStub = sinon.stub(customerItemStorage, "update");
  const getBranchStub = sinon.stub(branchStorage, "get");

  beforeEach(() => {
    getByQueryCustomerItemStub.reset();
  });

  describe("#extend()", () => {
    it("should reject if returned is true", () => {
      const customerItem = {
        deadline: new Date(),
        handout: true,
        returned: true,
      };

      getCustomerItemStub.withArgs("customerItem1").resolves(customerItem);

      const orderItem = {} as OrderItem;

      return expect(
        customerItemHandler.extend(
          "customerItem1",
          orderItem,
          "branch1",
          "order1"
        )
      ).to.be.rejectedWith(BlError, /can not extend when returned is true/);
    });

    it("should reject if orderItem.type is not extend", () => {
      const customerItem = {
        deadline: new Date(),
        handout: true,
        returned: false,
      };

      getCustomerItemStub.withArgs("customerItem1").resolves(customerItem);

      const orderItem = {
        type: "rent",
      } as OrderItem;

      return expect(
        customerItemHandler.extend(
          "customerItem1",
          orderItem,
          "branch1",
          "order1"
        )
      ).to.be.rejectedWith(BlError, /orderItem.type is not "extend"/);
    });

    it("should reject if branch does not have the extend period", () => {
      const customerItem = {
        deadline: new Date(),
        handout: true,
        returned: false,
      };

      getCustomerItemStub.withArgs("customerItem1").resolves(customerItem);

      const orderItem = {
        type: "extend",
        info: {
          from: new Date(),
          to: new Date(),
          numberOfPeriods: 1,
          periodType: "year",
          customerItem: "customerItem1",
        },
      } as OrderItem;

      const branch = {
        paymentInfo: {
          extendPeriods: [
            {
              type: "semester",
              date: new Date(),
              maxNumberOfPeriods: 1,
              price: 100,
            },
          ],
        },
      } as Branch;

      getBranchStub.withArgs("branch1").resolves(branch);

      return expect(
        customerItemHandler.extend(
          "customerItem1",
          orderItem,
          "branch1",
          "order1"
        )
      ).to.be.rejectedWith(
        BlError,
        /extend period "year" is not present on branch/
      );
    });
  });

  describe("#buyout()", () => {
    it('should reject if orderItem.type is not "buyout"', () => {
      const orderItem = {
        type: "rent",
      } as OrderItem;

      const customerItem = {} as CustomerItem;

      return expect(
        customerItemHandler.buyout("customerItem1", "order1", orderItem)
      ).to.be.rejectedWith('orderItem.type is not "buyout"');
    });
  });

  describe("#return()", () => {
    it('should reject if orderItem.type is not "return"', () => {
      const orderItem = {
        type: "rent",
      } as OrderItem;

      const customerItem = {} as CustomerItem;

      return expect(
        customerItemHandler.return(
          "customerItem1",
          "order1",
          orderItem,
          "branch1",
          "employee1"
        )
      ).to.be.rejectedWith('orderItem.type is not "return"');
    });
  });

  describe("#buyback()", () => {
    it('should reject if orderItem.type is not "buyout"', () => {
      const orderItem = {
        type: "rent",
      } as OrderItem;

      const customerItem = {} as CustomerItem;

      return expect(
        customerItemHandler.buyback("customerItem1", "order1", orderItem)
      ).to.be.rejectedWith('orderItem.type is not "buyback"');
    });
  });

  describe("#getNotReturned", () => {
    it("should return emtpy array if there are no customerItems", (done) => {
      getByQueryCustomerItemStub.onFirstCall().resolves([]);

      customerItemHandler
        .getNotReturned("5c33b6137eab87644f7e75e2", new Date(2012, 1, 1))
        .then((notReturnedCustomerItems) => {
          expect(notReturnedCustomerItems).to.eql([]);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should ask db with correct query", (done) => {
      const expectedQuery = new SEDbQuery();

      const before = new Date(2018, 11, 18);
      const deadline = new Date(2018, 11, 20);
      const after = new Date(2018, 11, 22);

      expectedQuery.dateFilters = [
        {
          fieldName: "deadline",
          op: {
            $gt: before,
            $lt: after,
          },
        },
      ];

      expectedQuery.objectIdFilters = [
        {
          fieldName: "customer",
          value: [
            "5c33b6137eab87644f7e75e2",
            mongoose.Types.ObjectId("5c33b6137eab87644f7e75e2"),
          ],
        },
      ];

      expectedQuery.booleanFilters = [
        { fieldName: "returned", value: false },
        { fieldName: "match", value: false },
        { fieldName: "buyout", value: false },
      ];

      getByQueryCustomerItemStub.withArgs(expectedQuery).resolves([]);

      customerItemHandler
        .getNotReturned("5c33b6137eab87644f7e75e2", deadline)
        .then((result) => {
          const queryArg = getByQueryCustomerItemStub.getCall(0).args[0];

          expect(queryArg.booleanFilters).to.be.eql(
            expectedQuery.booleanFilters
          );

          expect(queryArg.objectIdFilters).to.be.eql(
            expectedQuery.objectIdFilters
          );
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should return customerItems not returned with the specified deadline", (done) => {
      const customerItems = [
        {
          id: "1",
          item: "item1",
          deadline: new Date(2018, 11, 20),
          returned: false,
        },
        {
          id: "2",
          item: "item2",
          deadline: new Date(2018, 11, 20),
          returned: false,
        },
      ];

      getByQueryCustomerItemStub.returns(customerItems);

      customerItemHandler
        .getNotReturned("5c33b6137eab87644f7e75e2", new Date(2018, 11, 20))
        .then((result) => {
          expect(result).to.eql(customerItems);

          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it("should reject if customerItemStorage rejects", () => {
      getByQueryCustomerItemStub.rejects(new BlError("someting wrong"));

      expect(
        customerItemHandler.getNotReturned(
          "5c33b6137eab87644f7e75e2",
          new Date()
        )
      ).to.be.rejectedWith(BlError);
    });
  });
});
