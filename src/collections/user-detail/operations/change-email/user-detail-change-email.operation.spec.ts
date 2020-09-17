import "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import * as sinon from "sinon";
import { BlapiResponse, BlError, UserDetail } from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { Response } from "express";
import { BlApiRequest } from "../../../../request/bl-api-request";
chai.use(chaiAsPromised);
import { User } from "../../../user/user";
import { UserDetailChangeEmailOperation } from "./user-detail-change-email.operation";
import { LocalLogin } from "../../../local-login/local-login";
import { UserHandler } from "../../../../auth/user/user.handler";

describe("UserDetailChangeEmailOperation", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");
  const userStorage = new BlDocumentStorage<User>("users");
  const localLoginStorage = new BlDocumentStorage<LocalLogin>("locallogins");
  const userHandler = new UserHandler();
  const resHandler = new SEResponseHandler();

  const userDetailChangeEmailOperation = new UserDetailChangeEmailOperation(
    userDetailStorage,
    userStorage,
    localLoginStorage,
    userHandler,
    resHandler
  );

  const userDetailGetStub = sinon.stub(userDetailStorage, "get");
  const userDetailUpdateStub = sinon.stub(userDetailStorage, "update");
  const userAggregateStub = sinon.stub(userStorage, "aggregate");
  const userUpdateStub = sinon.stub(userStorage, "update");
  const userHandlerGetByUsernameStub = sinon.stub(userHandler, "getByUsername");
  const localLoginAggregateStub = sinon.stub(localLoginStorage, "aggregate");
  const localLoginUpdateStub = sinon.stub(localLoginStorage, "update");
  const resHandlerSendResponseStub = sinon.stub(resHandler, "sendResponse");

  beforeEach(() => {
    userDetailGetStub.reset();
    userDetailUpdateStub.reset();
    userAggregateStub.reset();
    userUpdateStub.reset();
    userHandlerGetByUsernameStub.reset();
    localLoginAggregateStub.reset();
    localLoginUpdateStub.reset();
    resHandlerSendResponseStub.reset();
  });

  it("should reject if blApiRequest.data is empty", () => {
    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "" }
      })
    ).to.eventually.be.rejectedWith(BlError, /email is not valid/);
  });

  it("should reject if userDetail is not found", () => {
    userDetailGetStub.rejects(new BlError("user detail not found"));

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "change@email.com" }
      })
    ).to.eventually.be.rejectedWith(BlError, /user detail not found/);
  });

  it("should reject if user is not found", () => {
    userDetailGetStub.resolves({ blid: "blid1", email: "email@email.com" });
    userAggregateStub.rejects(new BlError("no user found"));

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "change@email.com" }
      })
    ).to.eventually.be.rejectedWith(BlError, /no user found/);
  });

  it("should reject if local login is not found", () => {
    userDetailGetStub.resolves({ blid: "blid1", email: "email@email.com" });
    userAggregateStub.resolves([
      { blid: "blid1", username: "email@email.com" }
    ]);
    localLoginAggregateStub.rejects(new BlError("local login not found"));

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "change@email.com" }
      })
    ).to.eventually.be.rejectedWith(BlError, /local login not found/);
  });

  it("should reject if the email is already in database", () => {
    userDetailGetStub.resolves({ blid: "blid1", email: "email@email.com" });
    userAggregateStub.resolves([
      { blid: "blid1", username: "email@email.com" }
    ]);
    localLoginAggregateStub.resolves([{ username: "email@email.com" }]);
    userHandlerGetByUsernameStub.resolves([
      { username: "alreadyAdded@email.com" }
    ]);

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "alreadyAdded@email.com" }
      })
    ).to.eventually.be.rejectedWith(
      BlError,
      /email is already present in database/
    );
  });

  it("should reject if userDetailStorage.update rejects", () => {
    userDetailGetStub.resolves({ blid: "blid1", email: "email@email.com" });
    userAggregateStub.resolves([
      { blid: "blid1", username: "email@email.com" }
    ]);
    localLoginAggregateStub.resolves([{ username: "email@email.com" }]);
    userHandlerGetByUsernameStub.rejects(new BlError("not found"));
    userDetailUpdateStub.rejects(new BlError("could not update user detail"));

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "change@email.com" }
      })
    ).to.eventually.be.rejectedWith(BlError, /could not update user detail/);
  });

  it("should reject if user.update rejects", () => {
    userDetailGetStub.resolves({ blid: "blid1", email: "email@email.com" });
    userAggregateStub.resolves([
      { blid: "blid1", username: "email@email.com" }
    ]);
    localLoginAggregateStub.resolves([{ username: "email@email.com" }]);
    userHandlerGetByUsernameStub.rejects(new BlError("not found"));
    userDetailUpdateStub.resolves(true);
    userUpdateStub.rejects(new BlError("could not update user"));

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "change@email.com" }
      })
    ).to.eventually.be.rejectedWith(BlError, /could not update user/);
  });

  it("should reject if user.update rejects", () => {
    userDetailGetStub.resolves({ blid: "blid1", email: "email@email.com" });
    userAggregateStub.resolves([
      { blid: "blid1", username: "email@email.com" }
    ]);
    localLoginAggregateStub.resolves([{ username: "email@email.com" }]);
    userHandlerGetByUsernameStub.rejects(new BlError("not found"));
    userDetailUpdateStub.resolves(true);
    userUpdateStub.resolves(true);
    localLoginUpdateStub.rejects(new BlError("could not update local login"));

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "change@email.com" }
      })
    ).to.eventually.be.rejectedWith(BlError, /could not update local login/);
  });

  it("should resolve", () => {
    userDetailGetStub.resolves({ blid: "blid1", email: "email@email.com" });
    userAggregateStub.resolves([
      { blid: "blid1", username: "email@email.com" }
    ]);
    localLoginAggregateStub.resolves([{ username: "email@email.com" }]);
    userHandlerGetByUsernameStub.rejects(new BlError("not found"));
    userDetailUpdateStub.resolves(true);
    userUpdateStub.resolves(true);
    localLoginUpdateStub.resolves(true);
    resHandlerSendResponseStub.resolves(true);

    return expect(
      userDetailChangeEmailOperation.run({
        documentId: "userDetail1",
        data: { email: "change@email.com" }
      })
    ).to.eventually.be.true;
  });
});
