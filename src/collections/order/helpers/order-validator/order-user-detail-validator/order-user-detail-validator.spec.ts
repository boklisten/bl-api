// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, Order, UserDetail } from "@boklisten/bl-model";
import { OrderUserDetailValidator } from "./order-user-detail-validator";
import { BlDocumentStorage } from "../../../../../storage/blDocumentStorage";

chai.use(chaiAsPromised);

describe("OrderUserDetailValidator", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>("user_details");
  const orderUserDetailValidator = new OrderUserDetailValidator(
    userDetailStorage
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
        expect(err.errorStack[0].getMsg()).to.be.eq("could not get userDetail");
        done();
      });
    });

    //it('should reject if userDetail.emailConfirmed is false', (done) => {
    //testUserDetail.emailConfirmed = false;

    //orderUserDetailValidator.validate(testOrder).catch((err: BlError) => {
    //expect(err.errorStack[0].getMsg())
    //.to.be.eq('userDetail.emailConfirmed is not true');
    //done();
    //})
    //});

    it("should resolve if userDetail is valid", () => {
      return expect(orderUserDetailValidator.validate(testOrder)).to.be
        .fulfilled;
    });
  });
});
