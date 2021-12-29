// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
chai.use(chaiAsPromised);
import sinon from "sinon";
//const resHandler = new SEResponseHandler();
import { CustomerItemActiveBlid } from "../../customer-item/helpers/customer-item-active-blid";
import { UniqueItemActiveOperation } from "./unique-item-active.operation";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { UniqueItem } from "@boklisten/bl-model";

describe("UniqueItemActiveOperation", () => {
  describe("run()", () => {
    const customerItemActiveBlid = new CustomerItemActiveBlid();
    const uniqueItemStorage = new BlDocumentStorage<UniqueItem>("uniqueitems");

    const getActiveCustomerItemsStub = sinon.stub(
      customerItemActiveBlid,
      "getActiveCustomerItems"
    );

    const getUniqueItemStub = sinon.stub(uniqueItemStorage, "get");

    const resHandler = new SEResponseHandler();

    const uniqueItemActiveOperation = new UniqueItemActiveOperation(
      customerItemActiveBlid,
      uniqueItemStorage,
      resHandler
    );

    sinon.stub(resHandler, "sendResponse").resolves(true);

    beforeEach(() => {
      getUniqueItemStub.reset();
    });

    it("should return true", () => {
      getUniqueItemStub.resolves({ blid: "blid1" });

      getActiveCustomerItemsStub.resolves([]);

      return expect(
        uniqueItemActiveOperation.run({ documentId: "uniqueItem1" })
      ).to.eventually.be.true;
    });
  });
});
