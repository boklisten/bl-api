// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { AccessToken, BlError, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { UserDetailHelper } from "./user-detail.helper";
import { DibsEasyPayment } from "../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";

chai.use(chaiAsPromised);

describe("UserDetailHelper", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");
  const userDetailHelper = new UserDetailHelper(userDetailStorage);

  let testUserDetail: UserDetail;
  let userDetailStorageUpdateSuccess: boolean;
  let testAccessToken: AccessToken;

  beforeEach(() => {
    testUserDetail = {
      id: "userDetail1",
      name: "",
      email: "bill@blapi.co",
      phone: "",
      address: "",
      postCode: "",
      postCity: "",
      country: "",
      dob: new Date(),
      branch: "branch1",
    };

    testAccessToken = {
      sub: "user1",
      details: "userDetail1",
    } as AccessToken;

    userDetailStorageUpdateSuccess = true;
  });

  let userDetailStorageUpdateStub = sinon
    .stub(userDetailStorage, "update")
    .callsFake((id: string, data: any, user: any) => {
      if (!userDetailStorageUpdateSuccess) {
        return Promise.reject(new BlError("could not update"));
      }

      let returnObj = Object.assign(testUserDetail, data);
      return Promise.resolve(returnObj);
    });

  sinon.stub(userDetailStorage, "get").callsFake((id: string) => {
    if (id !== testUserDetail.id) {
      return Promise.reject(new BlError("not found"));
    }

    return Promise.resolve(testUserDetail);
  });

  describe("#updateUserDetailBasedOnDibsEasyPayment", () => {
    let testDibsEasyPayment;

    beforeEach(() => {
      testDibsEasyPayment = {
        consumer: {
          privatePerson: {
            email: "bill@blapi.co",
            firstName: "Billy",
            lastName: "Joel",
            merchantReference: "ref123",
            phoneNumber: {
              number: "12345678",
              prefix: "+47",
            },
          },
          shippingAddress: {
            addressLine1: "Trondheimsveien 10",
            addressLine2: "HO403",
            city: "OSLO",
            country: "NOR",
            postalCode: "0560",
          },
        },
      };
    });

    it("should update userDetail with values from dibsEasyPayment", (done) => {
      userDetailHelper
        .updateUserDetailBasedOnDibsEasyPayment(
          "userDetail1",
          testDibsEasyPayment as DibsEasyPayment,
          testAccessToken
        )
        .then((updatedUserDetail: UserDetail) => {
          let name =
            testDibsEasyPayment.consumer.privatePerson.firstName +
            " " +
            testDibsEasyPayment.consumer.privatePerson.lastName;

          expect(updatedUserDetail.name).to.eq(name);
          expect(updatedUserDetail.phone).to.eq(
            testDibsEasyPayment.consumer.privatePerson.phoneNumber.number
          );
          expect(updatedUserDetail.postCode).to.eq(
            testDibsEasyPayment.consumer.shippingAddress.postalCode
          );
          expect(updatedUserDetail.postCity).to.eql(
            testDibsEasyPayment.consumer.shippingAddress.city
          );

          let expectedAddress =
            testDibsEasyPayment.consumer.shippingAddress.addressLine1 +
            " " +
            testDibsEasyPayment.consumer.shippingAddress.addressLine2;
          expect(updatedUserDetail.address).to.eql(expectedAddress);

          done();
        });
    });

    it("should only update the fields in userDetail that are not already populated", (done) => {
      testUserDetail.name = "Jenny Jensen";

      testDibsEasyPayment.consumer.privatePerson["firstName"] = "Johnny";

      userDetailHelper
        .updateUserDetailBasedOnDibsEasyPayment(
          "userDetail1",
          testDibsEasyPayment,
          testAccessToken
        )
        .then((updatedUserDetail: UserDetail) => {
          expect(updatedUserDetail.name).to.eq("Jenny Jensen"); // this value was already stored
          expect(updatedUserDetail.postCity).to.eq(
            testDibsEasyPayment.consumer.shippingAddress.city
          ); // this value was empty, should set it from dibsPayment
          done();
        });
    });
  });
  describe("getFirstName()", () => {
    it("should resolve with first name", (done) => {
      const names: { n: string; f: string }[] = [
        { n: "Albert Einstein", f: "Albert" },
        { n: "Willy-Wonk Wonka", f: "Willy-Wonk" },
        { n: "Einar", f: "Einar" },
        { n: "", f: "" },
        { n: "S Hansen", f: "S" },
        { n: "Billy  Bob", f: "Billy" },
        { n: "Negil Veganer ", f: "Negil" },
        { n: " Bobby Bobson", f: "Bobby" },
        { n: "       Bobby Bobson", f: "Bobby" },
        { n: "       Bobby            Bobson", f: "Bobby" },
      ];

      for (let name of names) {
        expect(userDetailHelper.getFirstName(name.n)).to.eq(name.f);
      }
      done();
    });
  });

  describe("getLastName()", () => {
    it("should resolve with last name", (done) => {
      const names: { n: string; f: string }[] = [
        { n: "Albert Einstein", f: "Einstein" },
        { n: "Willy-Wonk Wonka", f: "Wonka" },
        { n: "Einar", f: "" },
        { n: "", f: "" },
        { n: "S Hansen", f: "Hansen" },
        { n: "Wiliam Jens-book Jensen", f: "Jensen" },
        { n: "Birger  Ruud", f: "Ruud" },
        { n: "Jens Hansen ", f: "Hansen" },
        { n: "     Bjorn   Belto ", f: "Belto" },
      ];

      for (let name of names) {
        expect(userDetailHelper.getLastName(name.n)).to.eq(name.f);
      }
      done();
    });
  });
});
