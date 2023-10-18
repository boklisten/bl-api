import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, UserDetail } from "@boklisten/bl-model";
import { PasswordResetPostHook } from "./password-reset-post.hook";
import { PasswordReset } from "../password-reset";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { UserHandler } from "../../../auth/user/user.handler";
import { User } from "../../user/user";
import { isNullOrUndefined } from "util";
import { SeCrypto } from "../../../crypto/se.crypto";
import { Messenger } from "../../../messenger/messenger";
import { BlCollectionName } from "../../bl-collection";

chai.use(chaiAsPromised);

describe("PasswordResetPostHook", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>(
    BlCollectionName.UserDetails,
  );
  const userHandler = new UserHandler();
  const seCrypto = new SeCrypto();
  const messenger = new Messenger();
  const passwordResetPostHook = new PasswordResetPostHook(
    userDetailStorage,
    userHandler,
    seCrypto,
    messenger,
  );

  let testUsername: string;
  let testUser: User;
  let testPasswordReset: PasswordReset;
  let testToken: string;

  beforeEach(() => {
    testUsername = "albert@blapi.com";
    testPasswordReset = new PasswordReset();
    testPasswordReset.email = testUsername;
    testToken = "aLongRandomTokenString";

    testUser = {
      id: "user1",
      userDetail: "userDetail1",
      permission: "customer",
      login: {
        provider: "local",
        providerId: "local123",
      },
      blid: "u#xyz",
      username: testUsername,
      valid: true,
      user: {
        id: "u#xyz",
        permission: "customer",
      },
      active: true,
    } as any;
  });

  describe("#before", () => {
    it("should reject if passwordReset is empty or undefined", () => {
      return expect(passwordResetPostHook.before(undefined)).to.be.rejectedWith(
        BlError,
        /passwordReset is empty or undefined/,
      );
    });

    context("when email (username) is not on a valid format", () => {
      const expectedError = /passwordReset.email is not a valid email/;

      it('should reject if passwordReset.email is "b.com"', () => {
        const passwordReset = new PasswordReset();
        passwordReset.email = "b.com";

        return expect(
          passwordResetPostHook.before(passwordReset),
        ).to.be.rejectedWith(BlError, expectedError);
      });

      it('should reject if passwordReset.email is "jonman"', () => {
        const passwordReset = new PasswordReset();
        passwordReset.email = "jonman";

        return expect(
          passwordResetPostHook.before(passwordReset),
        ).to.be.rejectedWith(BlError, expectedError);
      });

      it('should reject if passwordReset.email is "undefined"', () => {
        const passwordReset = new PasswordReset();
        passwordReset.email = undefined;

        return expect(
          passwordResetPostHook.before(passwordReset),
        ).to.be.rejectedWith(BlError, expectedError);
      });
    });

    sinon.stub(userHandler, "getByUsername").callsFake((username: string) => {
      if (username !== testUsername) {
        return Promise.reject("username is not found");
      }
      return Promise.resolve(testUser);
    });

    it("should reject if username (email) is not found in storage", () => {
      testUsername = "bill@mail.com";
      const passwordReset = new PasswordReset();
      passwordReset.email = "notFound@mail.com";

      return expect(
        passwordResetPostHook.before(passwordReset),
      ).to.be.rejectedWith(BlError, /user "notFound@mail.com" not found/);
    });

    describe("when user is found in storage", () => {
      it("should reject if user.active is false", () => {
        testUser.active = false;

        return expect(
          passwordResetPostHook.before(testPasswordReset),
        ).to.be.rejectedWith(BlError, /user.active is false/);
      });
    });

    sinon.stub(seCrypto, "random").callsFake(() => {
      return testToken;
    });

    describe("when username is found and user is valid", () => {
      it("should resolve with a passwordReset object including a reset token", (done) => {
        passwordResetPostHook
          .before(testPasswordReset)
          .then((passwordReset: PasswordReset) => {
            expect(!isNullOrUndefined(passwordReset.token)).to.be.true;
            expect(passwordReset.token).to.be.eql(testToken);
            expect(passwordReset.userDetail).to.be.eql(testUser.userDetail);
            done();
          });
      });
    });
  });

  describe("#after", () => {
    const testUserDetail: UserDetail = {
      id: "userDetail1",
      name: "Test User",
      email: testUsername,
      phone: "",
      address: "",
      postCode: "",
      postCity: "",
      country: "",
      dob: new Date(),
      branch: "",
      emailConfirmed: true,
    };

    beforeEach(() => {
      testPasswordReset = {
        id: "passwordReset1",
        email: testUsername,
        token: testToken,
        userDetail: testUser.userDetail,
      };
    });

    sinon.stub(userDetailStorage, "get").callsFake((id: string) => {
      if (id !== testUserDetail.id) {
        return Promise.reject(new BlError("userDetail not found"));
      }

      return Promise.resolve(testUserDetail);
    });

    const messengerPasswordResetStub = sinon
      .stub(messenger, "passwordReset")
      .callsFake(() => {});

    it("should reject if passwordReset.userDetail is not found", () => {
      testPasswordReset.userDetail = "notFound@mail.com";

      return expect(
        passwordResetPostHook.after([testPasswordReset]),
      ).to.be.rejectedWith(BlError, /userDetail "notFound@mail.com" not found/);
    });

    it("should send email to user with reset password token", (done) => {
      passwordResetPostHook.after([testPasswordReset]).then(() => {
        expect(messengerPasswordResetStub.called).to.be.true;

        expect(
          messengerPasswordResetStub.calledWithExactly(
            testUserDetail,
            testPasswordReset.id,
          ),
        ).to.be.true;

        done();
      });
    });
  });
});
