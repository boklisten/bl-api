import "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { BlError, Order, UserDetail } from "@boklisten/bl-model";
import { OrderUserDetailValidator } from "./order-user-detail-validator";
import { BlDocumentStorage } from "../../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../../bl-collection";

chai.use(chaiAsPromised);

describe("OrderUserDetailValidator", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>(
    BlCollectionName.UserDetails,
  );
  const orderUserDetailValidator = new OrderUserDetailValidator(
    userDetailStorage,
  );
  let testOrder: Order;
  let testUserDetail: UserDetail;

  beforeEach(() => {
    testOrder = {
      id: "order1",
      customer: "userDetail1",
    } as Order;

    testUserDetail = {
      id: "userDetail1",
      emailConfirmed: true,
    } as UserDetail;
  });

  sinon.stub(userDetailStorage, "get").callsFake((id: string) => {
    if (id !== testUserDetail.id) {
      return Promise.reject(new BlError("could not get userDetail"));
    }

    return Promise.resolve(testUserDetail);
  });

  describe("#validate", () => {
    it("should reject if userDetail is not found", (done) => {
      testOrder.customer = "notFound";

      orderUserDetailValidator.validate(testOrder).catch((err: BlError) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(err.errorStack[0].getMsg()).to.be.eq("could not get userDetail");
        done();
      });
    });

    it("should resolve if userDetail is valid", () => {
      return expect(orderUserDetailValidator.validate(testOrder)).to.be
        .fulfilled;
    });
  });
});
