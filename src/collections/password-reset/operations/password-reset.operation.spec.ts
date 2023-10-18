import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError } from "@boklisten/bl-model";
import { BlApiRequest } from "../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { PasswordReset } from "../password-reset";
import { PasswordResetOperation } from "./password-reset.operation";
import { Response } from "express";
import { BlCollectionName } from "../../bl-collection";

chai.use(chaiAsPromised);

describe("PasswordResetOperation", () => {
  let testBlApiRequest: BlApiRequest;
  let testPasswordReset: PasswordReset;
  let testRedirectPath: string;
  const passwordResetStorage = new BlDocumentStorage<PasswordReset>(
    BlCollectionName.PasswordResets,
  );
  const passwordResetOperation = new PasswordResetOperation(
    passwordResetStorage,
  );

  const testResponse = {
    redirect: (uri: string) => {},
  } as Response;

  beforeEach(() => {
    testBlApiRequest = {
      documentId: "passwordReset1",
    };

    testPasswordReset = {
      id: "passwordReset1",
      email: "bill@mail.com",
      userDetail: "userDetail1",
      token: "randomToken",
    };

    testRedirectPath =
      process.env.CLIENT_URI +
      "auth/password/" +
      testPasswordReset.id +
      "/reset";
  });

  sinon.stub(passwordResetStorage, "get").callsFake((id: string) => {
    if (id !== testPasswordReset.id) {
      return Promise.reject(new BlError("not found"));
    }

    return Promise.resolve(testPasswordReset);
  });

  const testResponseRedirectSpy = sinon.spy(testResponse, "redirect");

  describe("#run", () => {
    it("should reject if documentId is not found", () => {
      testBlApiRequest.documentId = "notFoundId";

      return expect(
        passwordResetOperation.run(testBlApiRequest),
      ).to.be.rejectedWith(BlError, /passwordReset "notFoundId" not found/);
    });

    it("should redirect to correct path if passwordReset is found", (done) => {
      passwordResetOperation
        .run(testBlApiRequest, null, testResponse)
        .then(() => {
          expect(testResponseRedirectSpy.calledOnce).to.be.true;

          expect(testResponseRedirectSpy.calledWith(testRedirectPath)).to.be
            .true;

          done();
        });
    });
  });
});
