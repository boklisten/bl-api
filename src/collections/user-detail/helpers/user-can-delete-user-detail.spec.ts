// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, AccessToken, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { UserCanDeleteUserDetail } from "./user-can-delete-user-detail";
import { User } from "../../user/user";

chai.use(chaiAsPromised);

describe("UserCanDeleteUserDetail", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");
  const userDetailGetIdStub = sinon.stub(userDetailStorage, "get");

  const userStorage = new BlDocumentStorage<User>("users");
  const userGetByQueryStub = sinon.stub(userStorage, "getByQuery");

  const userCanDeleteUserDetail = new UserCanDeleteUserDetail(
    userDetailStorage,
    userStorage
  );

  beforeEach(() => {
    userDetailGetIdStub.reset();
    userGetByQueryStub.reset();
  });

  describe("canDelete()", () => {
    it("should be possible to delete her own user", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "customer",
        details: "userDetail1",
      };
      userDetailGetIdStub.resolves({ id: "userDetail1" });

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail1", accessToken)
      ).to.eventually.be.true;
    });

    it("should not be possible to delete a user with higher permission", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "customer",
        details: "userDetail1",
      };

      userDetailGetIdStub.resolves({
        id: "userDetail2",
        email: "user@test.com",
      });

      userGetByQueryStub.resolves([{ permission: "admin" }]);

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail2", accessToken)
      ).to.eventually.be.false;
    });

    it("should not be possible to delete a user with the same permission", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "admin",
        details: "userDetail1",
      };

      userDetailGetIdStub.resolves({
        id: "userDetail2",
        email: "user@test.com",
      });

      userGetByQueryStub.resolves([{ permission: "admin" }]);

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail2", accessToken)
      ).to.eventually.be.false;
    });

    it("should not be possible to delete another user if your permission is below admin", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "manager",
        details: "userDetail1",
      };

      userDetailGetIdStub.resolves({
        id: "userDetail2",
        email: "user@test.com",
      });

      userGetByQueryStub.resolves([{ permission: "customer" }]);

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail2", accessToken)
      ).to.eventually.be.false;
    });

    it("should be possible to delete a user with permission 'admin' if you have permission 'super'", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "super",
        details: "userDetail1",
      };

      userDetailGetIdStub.resolves({
        id: "userDetail2",
        email: "user@test.com",
      });

      userGetByQueryStub.resolves([{ permission: "admin" }]);

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail2", accessToken)
      ).to.eventually.be.true;
    });

    it("should be possible to delete a user with permission 'manager' if you have permission 'admin'", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "admin",
        details: "userDetail1",
      };

      userDetailGetIdStub.resolves({
        id: "userDetail2",
        email: "user@test.com",
      });

      userGetByQueryStub.resolves([{ permission: "manager" }]);

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail2", accessToken)
      ).to.eventually.be.true;
    });

    it("should be possible to delete a user with permission 'employee' if you have permission 'admin'", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "admin",
        details: "userDetail1",
      };

      userDetailGetIdStub.resolves({
        id: "userDetail2",
        email: "user@test.com",
      });

      userGetByQueryStub.resolves([{ permission: "employee" }]);

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail2", accessToken)
      ).to.eventually.be.true;
    });

    it("should be possible to delete a user with permission 'customer' if you have permission 'admin'", () => {
      const accessToken: AccessToken = {
        iss: "",
        aud: "",
        iat: 0,
        exp: 0,
        sub: "",
        username: "",
        permission: "admin",
        details: "userDetail1",
      };

      userDetailGetIdStub.resolves({
        id: "userDetail2",
        email: "user@test.com",
      });

      userGetByQueryStub.resolves([{ permission: "customer" }]);

      return expect(
        userCanDeleteUserDetail.canDelete("userDetail2", accessToken)
      ).to.eventually.be.true;
    });
  });
});
