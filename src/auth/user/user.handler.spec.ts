// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { expect } from "chai";
import { UserSchema } from "../../collections/user/user.schema";
import { UserHandler } from "./user.handler";
import { BlError, UserDetail } from "@boklisten/bl-model";
import { User } from "../../collections/user/user";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { SEDbQuery } from "../../query/se.db-query";
import { EmailValidationHelper } from "../../collections/email-validation/helpers/email-validation.helper";
import { LocalLoginHandler } from "../local/local-login.handler";

chai.use(chaiAsPromised);

let testUser = {
  id: "user1",
  userDetail: "userDetail1",
  permission: "customer",
  login: {
    provider: "local",
    providerId: "123",
  },
  blid: "",
  username: "bill@gmail.com",
  valid: false,
  active: true,
};

describe("UserHandler", () => {
  const userStorage: BlDocumentStorage<User> = new BlDocumentStorage(
    "users",
    UserSchema
  );
  const emailValidationHelper: EmailValidationHelper = new EmailValidationHelper();
  const userDetailStorage: BlDocumentStorage<UserDetail> = new BlDocumentStorage(
    "userdetails",
    UserDetail
  );
  const localLoginHandler: LocalLoginHandler = new LocalLoginHandler();
  let userHandler = new UserHandler(
    userDetailStorage,
    userStorage,
    emailValidationHelper,
    localLoginHandler
  );
  let testProvider = "";
  let testProviderId = "";
  let testUsername = "";
  let emailValidationLinkSuccess = true;

  beforeEach(() => {
    testProvider = testUser.login.provider;
    testProviderId = testUser.login.providerId;
    testUsername = testUser.username;
    emailValidationLinkSuccess = true;
  });

  let emailValidationHelperSendLinkStub = sinon
    .stub(emailValidationHelper, "createAndSendEmailValidationLink")
    .callsFake((userDetailId: string) => {
      if (!emailValidationLinkSuccess) {
        return Promise.reject(
          new BlError("could not create and send email validation")
        );
      }

      return Promise.resolve(true);
    });

  sinon.stub(userDetailStorage, "add").callsFake(() => {
    return new Promise((resolve, reject) => {
      resolve({ id: testUser.userDetail, user: { id: testUser.blid } } as any);
    });
  });

  sinon.stub(userStorage, "add").callsFake((data: any, user: any) => {
    return new Promise((resolve, reject) => {
      resolve(testUser);
    });
  });

  let localLoginHandlerGetStub = sinon
    .stub(localLoginHandler, "get")
    .callsFake(() => {
      return Promise.resolve({});
    });

  let userStorageGetByQueryStub = sinon
    .stub(userStorage, "getByQuery")
    .callsFake((query: SEDbQuery) => {
      return new Promise((resolve, reject) => {
        if (query.stringFilters[0].value !== testUser.username) {
          return reject(new BlError("not found").code(702));
        }

        resolve([{ username: testUser.username }]);
      });
    });

  describe("get()", () => {
    describe("should reject with BlError when", () => {
      it("provider is empty", () => {
        let provider = "";
        return userHandler
          .get(provider, testProviderId)
          .should.rejectedWith(BlError);
      });

      it("provider is null", () => {
        let provider = null;
        return userHandler
          .get(provider, testProviderId)
          .should.rejectedWith(BlError);
      });

      it("providerId is null", () => {
        let providerId = null;
        return userHandler
          .get(testProvider, providerId)
          .should.rejectedWith(BlError);
      });

      it("providerId is empty", () => {
        let providerId = "";
        return userHandler
          .get(testProvider, providerId)
          .should.rejectedWith(BlError);
      });
    });
  });

  describe("getByUsername()", () => {
    context("when username is undefined", () => {
      it("should reject with BlError", () => {
        let username = undefined;
        return userHandler
          .getByUsername(username)
          .should.be.rejectedWith(BlError);
      });
    });

    context("when username is not found", () => {
      it("should reject with BlError code 702 not found", (done) => {
        let username = "thisis@notfound.com";

        userHandler.getByUsername(username).catch((error: BlError) => {
          error.getCode().should.be.eq(702);
          done();
        });
      });
    });

    context("when username is found", () => {
      it("should resolve with a User object", (done) => {
        userHandler.getByUsername(testUser.username).then((user: User) => {
          user.username.should.be.eq(testUser.username);
          done();
        });
      });
    });

    context("when multiple users is found with same username", () => {
      it("should select the first one with primary if primary is set", () => {
        let username = "jimmy@dore.com";
        const testUsers = [
          { username: username, movedToPrimary: "someObjectId" },
          { username: username, primary: true },
        ];

        let dbQuery = new SEDbQuery();
        dbQuery.stringFilters = [{ fieldName: "username", value: username }];

        userStorageGetByQueryStub.withArgs(dbQuery).resolves(testUsers);

        return expect(
          userHandler.getByUsername(username)
        ).to.eventually.be.eql({ username: username, primary: true });
      });
    });
  });

  describe("create()", () => {
    describe("should reject whith BlError when", () => {
      it("username is undefined", () => {
        let username = undefined;
        return userHandler
          .create(username, testProvider, testProviderId)
          .should.be.rejectedWith(BlError);
      });

      it("provider is empty", () => {
        let provider = "";
        return userHandler
          .create(testUsername, provider, testProviderId)
          .should.be.rejectedWith(BlError);
      });

      it("providerId is null", () => {
        let providerId = "";
        return userHandler
          .create(testUsername, testProvider, providerId)
          .should.be.rejectedWith(BlError);
      });
    });

    it("should resolve with a user when username, provider and providerId is valid", () => {
      return userHandler
        .create("jesus@christ.com", testProvider, testProviderId)
        .then((user: User) => {
          user.username.should.be.eql(testUser.username);
          user.login.should.be.eql(testUser.login);
        });
    });

    it('should reject if username already exists and provider is "local"', (done) => {
      testUsername = "James@bond.com";
      let dbQuery = new SEDbQuery();
      dbQuery.stringFilters = [{ fieldName: "username", value: testUsername }];

      userStorageGetByQueryStub.withArgs(dbQuery).resolves([testUser]);

      userHandler
        .create(testUsername, "local", "someProviderId")
        .catch((blError: BlError) => {
          expect(blError.getMsg()).to.be.eq(
            `username "${testUsername}" already exists, but trying to create new user with provider "local"`
          );

          expect(blError.getCode()).to.be.eq(903);
          done();
        });
    });

    it('should resolve if username already exists and provider is "google"', () => {
      testUsername = "gert@bert.com";
      let dbQuery = new SEDbQuery();
      dbQuery.stringFilters = [{ fieldName: "username", value: testUsername }];

      userStorageGetByQueryStub.withArgs(dbQuery).resolves([testUser]);

      return expect(userHandler.create(testUsername, "google", "someGoogleId"))
        .to.be.fulfilled;
    });

    it('should resolve if username already exists and provider is "facebook"', () => {
      testUsername = "jets@bets.com";
      let dbQuery = new SEDbQuery();
      dbQuery.stringFilters = [{ fieldName: "username", value: testUsername }];

      userStorageGetByQueryStub.withArgs(dbQuery).resolves([testUser]);

      return expect(
        userHandler.create(testUsername, "facebook", "someFacebookId")
      ).to.be.fulfilled;
    });

    it("should reject if emailValidationHelper rejects on sending of email validation link", (done) => {
      emailValidationLinkSuccess = false;

      userHandler
        .create("jhon@boi.com", testProvider, testProviderId)
        .catch((blError: BlError) => {
          expect(blError.errorStack.length).to.be.gte(1);

          expect(blError.errorStack[0].getMsg()).to.be.eq(
            "could not send out email validation link"
          );

          expect(blError.getCode()).to.eq(903);

          done();
        });
    });

    it("should send out email validation link on user creation", (done) => {
      emailValidationLinkSuccess = true;
      testUsername = "johnny@ronny.com";

      userHandler
        .create(testUsername, testProvider, testProviderId)
        .then(() => {
          expect(emailValidationHelperSendLinkStub).to.have.been.calledWith(
            testUser.userDetail
          );

          done();
        });
    });
  });

  describe("exists()", () => {
    describe("should reject with BlError when", () => {
      it("provider is undefined", () => {
        let provider = undefined;
        return userHandler
          .exists(provider, testProviderId)
          .should.be.rejectedWith(BlError);
      });

      it("providerId is empty", () => {
        let providerId = "";
        return userHandler
          .exists(testProvider, providerId)
          .should.be.rejectedWith(BlError);
      });
    });
  });

  describe("#valid", () => {
    it("should reject if user.active is false", () => {
      testUser.active = false;

      return expect(userHandler.valid(testUsername)).to.be.rejectedWith(
        BlError,
        /user.active is false/
      );
    });
  });
});
