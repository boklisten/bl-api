// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, AccessToken, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { User } from "../../user/user";
import { UserDeleteAllInfo } from "./user-delete-all-info";
import { LocalLogin } from "../../local-login/local-login";
chai.use(chaiAsPromised);

describe("UserDeleteAllInfo", () => {
  const localLoginStorage = new BlDocumentStorage<LocalLogin>("locallogins");
  const userStorage = new BlDocumentStorage<User>("users");
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");

  const localLoginRemoveStub = sinon.stub(localLoginStorage, "remove");
  const localLoginGetByQueryStub = sinon.stub(localLoginStorage, "getByQuery");
  const userRemoveStub = sinon.stub(userStorage, "remove");
  const userGetByQueryStub = sinon.stub(userStorage, "getByQuery");
  const userDetailGetStub = sinon.stub(userDetailStorage, "get");

  const userDeleteAllInfo = new UserDeleteAllInfo(
    userStorage,
    localLoginStorage
  );

  beforeEach(() => {
    localLoginRemoveStub.reset();
    userRemoveStub.reset();
    userGetByQueryStub.reset();
    userDetailGetStub.reset();
    localLoginGetByQueryStub.reset();
  });

  describe("deleteAllInfo()", () => {
    it("should call userStorage.remove with correct data", async () => {
      const userIdToRemove = "5daf2cf19f92d901e41c10d4";
      const userDetailIdToRemove = "5daf2cf19f92d901e41c10d6";
      const localLoginIdToRemove = "5daf2cf19f92d901e41c10ff";

      userRemoveStub.resolves(true);
      localLoginRemoveStub.resolves(true);

      userGetByQueryStub.resolves([
        { id: userIdToRemove, username: "user@1234.com" },
      ]);
      localLoginGetByQueryStub.resolves([{ id: localLoginIdToRemove }]);

      const accessToken = {
        details: "user777",
        permission: "admin",
      } as AccessToken;

      const result = await userDeleteAllInfo.deleteAllInfo(
        userDetailIdToRemove,
        accessToken
      );

      return expect(
        userRemoveStub.getCall(0).calledWithMatch(userIdToRemove, {
          id: accessToken.details,
          permission: accessToken.permission,
        })
      ).to.be.true;
    });

    it("should call localLoginStorage.remove with correct data", async () => {
      const userIdToRemove = "5daf2cf19f92d901e41c10d4";
      const userDetailIdToRemove = "5daf2cf19f92d901e41c10d6";
      const localLoginIdToRemove = "5daf2cf19f92d901e41c10ff";

      userRemoveStub.resolves(true);
      localLoginRemoveStub.resolves(true);

      userGetByQueryStub.resolves([
        { id: userIdToRemove, username: "user@1234.com" },
      ]);

      localLoginGetByQueryStub.resolves([{ id: localLoginIdToRemove }]);

      const accessToken = {
        details: "user777",
        permission: "admin",
      } as AccessToken;

      const result = await userDeleteAllInfo.deleteAllInfo(
        userDetailIdToRemove,
        accessToken
      );

      return expect(
        localLoginRemoveStub.getCall(0).calledWithMatch(localLoginIdToRemove, {
          id: accessToken.details,
          permission: accessToken.permission,
        })
      ).to.be.true;
    });

    it("should reject if there is more than one user with the same username", async () => {
      const userIdToRemove = "5daf2cf19f92d901e41c10d4";
      const userIdToRemove2 = "5daf2cf19f92d901e41c10d2";
      const userDetailIdToRemove = "5daf2cf19f92d901e41c10d6";
      const localLoginIdToRemove = "5daf2cf19f92d901e41c10ff";

      userRemoveStub.resolves(true);
      localLoginRemoveStub.resolves(true);

      userGetByQueryStub.resolves([
        { id: userIdToRemove, username: "user@1234.com" },
        { id: userIdToRemove2, username: "user@1234.com" },
      ]);

      localLoginGetByQueryStub.resolves([{ id: localLoginIdToRemove }]);

      const accessToken = {
        details: "user777",
        permission: "admin",
      } as AccessToken;

      return expect(
        userDeleteAllInfo.deleteAllInfo(userDetailIdToRemove, accessToken)
      ).to.eventually.be.rejectedWith(BlError, /multiple users was found/);
    });

    it("should resolve with true if user info was deleted", async () => {
      const userIdToRemove = "5daf2cf19f92d901e41c10d4";
      const userDetailIdToRemove = "5daf2cf19f92d901e41c10d6";
      const localLoginIdToRemove = "5daf2cf19f92d901e41c10ff";

      userRemoveStub.resolves(true);
      localLoginRemoveStub.resolves(true);

      userGetByQueryStub.resolves([
        { id: userIdToRemove, username: "user@1234.com" },
      ]);
      localLoginGetByQueryStub.resolves([{ id: localLoginIdToRemove }]);

      const accessToken = {
        details: "user777",
        permission: "admin",
      } as AccessToken;

      return expect(
        userDeleteAllInfo.deleteAllInfo(userDetailIdToRemove, accessToken)
      ).to.eventually.be.true;
    });
  });
});
