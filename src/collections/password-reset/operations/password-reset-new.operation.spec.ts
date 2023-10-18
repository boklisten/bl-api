import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { PasswordResetNewOperation } from "./password-reset-new.operation";
import { PasswordReset } from "../password-reset";
import { BlApiRequest } from "../../../request/bl-api-request";
import { LocalLoginHandler } from "../../../auth/local/local-login.handler";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { BlCollectionName } from "../../bl-collection";

chai.use(chaiAsPromised);

describe("PasswordResetNewOperation", () => {
  const passwordResetStorage = new BlDocumentStorage<PasswordReset>(
    BlCollectionName.PasswordResets,
  );
  const localLoginHandler = new LocalLoginHandler();
  const resHandler = new SEResponseHandler();
  const passwordResetNewOperation = new PasswordResetNewOperation(
    passwordResetStorage,
    localLoginHandler,
    resHandler,
  );
  let testBlApiRequest: BlApiRequest;
  let testPasswordReset: PasswordReset;
  let localLoginUpdateSuccess: boolean;

  beforeEach(() => {
    testBlApiRequest = {
      documentId: "passwordReset1",
      data: {
        password: "newPassword123",
      },
    };

    testPasswordReset = {
      id: "passwordReset1",
      email: "user@mail.com",
      token: "aRandomToken",
    };

    localLoginUpdateSuccess = true;
  });

  sinon.stub(passwordResetStorage, "get").callsFake((id: string) => {
    if (id !== testPasswordReset.id) {
      return Promise.reject(new BlError("not found"));
    }

    return Promise.resolve(testPasswordReset);
  });

  const responseHandlerSpy = sinon
    .stub(resHandler, "sendResponse")
    .callsFake(() => {
      return true;
    });

  sinon
    .stub(localLoginHandler, "setPassword")
    .callsFake((username: string, password: string) => {
      if (localLoginUpdateSuccess) {
        return Promise.resolve(true);
      }

      return Promise.reject(new BlError("could not set password"));
    });

  describe("#run", () => {
    it("should reject if blApiRequest.documentId is not found", () => {
      testBlApiRequest.documentId = "notFoundPasswordReset";

      return expect(
        passwordResetNewOperation.run(testBlApiRequest),
      ).to.be.rejectedWith(
        BlError,
        /passwordReset "notFoundPasswordReset" not found/,
      );
    });

    it("should reject if blApiRequest.data.password is null or undefined", () => {
      testBlApiRequest.data["password"] = null;

      return expect(
        passwordResetNewOperation.run(testBlApiRequest),
      ).to.be.rejectedWith(
        BlError,
        /blApiRequest.data.password is null or undefined/,
      );
    });

    it("should reject if blApiRequest.data.password is under length of 6", () => {
      testBlApiRequest.data["password"] = "abcde";

      return expect(
        passwordResetNewOperation.run(testBlApiRequest),
      ).to.be.rejectedWith(
        BlError,
        /blApiRequest.data.password is under length of 6/,
      );
    });

    it("should reject if localLoginHandler.setPassword rejects", () => {
      localLoginUpdateSuccess = false;

      return expect(
        passwordResetNewOperation.run(testBlApiRequest),
      ).to.be.rejectedWith(
        BlError,
        /could not update localLogin with password/,
      );
    });

    it("should resolve if given valid documentId and password", () => {
      return expect(passwordResetNewOperation.run(testBlApiRequest)).to.be
        .fulfilled;
    });

    it("should call response handler with valid response if input is valid", (done) => {
      passwordResetNewOperation.run(testBlApiRequest).then(() => {
        expect(responseHandlerSpy.called).to.be.true;
        done();
      });
    });
  });
});
