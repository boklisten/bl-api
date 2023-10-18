import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { LocalLoginHandler } from "./local-login.handler";
import { LocalLogin } from "../../collections/local-login/local-login";
import { LocalLoginValidator } from "./local-login.validator";
import { LocalLoginPasswordValidator } from "./password/local-login-password.validator";
import { SeCrypto } from "../../crypto/se.crypto";
import { HashedPasswordGenerator } from "./password/hashed-password-generator";
import { SaltGenerator } from "./salt/salt-generator";
import { LocalLoginCreator } from "./local-login-creator/local-login-creator";
import { ProviderIdGenerator } from "./provider-id/provider-id-generator";
import { BlError } from "@boklisten/bl-model";
import { UserHandler } from "../user/user.handler";
import { User } from "../../collections/user/user";
import sinon from "sinon";

chai.use(chaiAsPromised);

const testLocalLogin = {
  username: "albert@protonmail.com",
  provider: "local",
  providerId: "123",
  hashedPassword: "a",
  salt: "dog",
  id: "12354",
};

describe("LocalLoginValidator", () => {
  const localLoginPasswordValidator = new LocalLoginPasswordValidator(
    new SeCrypto(),
  );
  const saltGenerator = new SaltGenerator();
  const seCrypto = new SeCrypto();
  const hashedPasswordGenerator = new HashedPasswordGenerator(
    saltGenerator,
    seCrypto,
  );
  const providerIdGenerator = new ProviderIdGenerator(seCrypto);
  const localLoginCreator = new LocalLoginCreator(
    hashedPasswordGenerator,
    providerIdGenerator,
  );
  const localLoginHandler = new LocalLoginHandler();
  const userHandler = new UserHandler();
  const localLoginValidator = new LocalLoginValidator(
    localLoginHandler,
    localLoginPasswordValidator,
    localLoginCreator,
    userHandler,
  );

  sinon.stub(localLoginHandler, "get").callsFake((username: string) => {
    return new Promise((resolve, reject) => {
      if (username === testLocalLogin.username) resolve(testLocalLogin);
      reject(new BlError("").code(702));
    });
  });

  sinon.stub(localLoginHandler, "add").callsFake((localLogin: LocalLogin) => {
    return new Promise((resolve, reject) => {
      resolve(localLogin);
    });
  });

  sinon
    .stub(localLoginPasswordValidator, "validate")
    .callsFake((password: string, salt: string, hashedPassword: any) => {
      return Promise.resolve(true);
    });

  sinon
    .stub(userHandler, "create")
    .callsFake((username: string, provider: string, providerId: string) => {
      return Promise.resolve({
        id: "",
        userDetail: "",
        permission: "customer",
        login: {
          provider: provider,
          providerId: providerId,
        },
        blid: "",
        username: username,
        valid: true,
        active: true,
        lastActive: "",
        lastRequest: "",
      } as User);
    });

  sinon.stub(userHandler, "valid").callsFake(() => {
    return Promise.resolve(true);
  });

  describe("validate()", () => {
    let testUserName = "";
    let testPassword = "";

    beforeEach(() => {
      testUserName = "albert@protonmail.com";
      testPassword = "hello";
    });

    describe("should reject with BlError when", () => {
      it("username is not an email", () => {
        testUserName = "bill";
        return localLoginValidator
          .validate(testUserName, testPassword)
          .should.be.rejectedWith(BlError);
      });

      it("password is empty", () => {
        testPassword = "";
        return localLoginValidator
          .validate(testUserName, testPassword)
          .should.be.rejectedWith(BlError);
      });
    });

    describe("should reject with BlError when", () => {
      it("username does not exist", () => {
        testUserName = "billy@user.com";
        testPassword = "thePassword";
        return localLoginValidator.validate(testUserName, testPassword).then(
          (value: any) => {
            value.should.not.be.fulfilled;
          },
          (error: BlError) => {
            error.getCode().should.be.eq(702);
          },
        );
      });
    });

    it("should resolve with correct provider and providerId when username and password is correct", () => {
      const expectedProvider = {
        provider: testLocalLogin.provider,
        providerId: testLocalLogin.providerId,
      };
      return new Promise((resolve, reject) => {
        localLoginValidator.validate(testUserName, testPassword).then(
          (returnedProvider: { provider: string; providerId: string }) => {
            if (returnedProvider.providerId === expectedProvider.providerId)
              resolve(true);
            reject(new Error("provider is not equal to expectedProvider"));
          },
          (error: any) => {
            reject(error);
          },
        );
      }).should.eventually.be.true;
    });
  });

  describe("create()", () => {
    it("should reject with BlError if username does exist", () => {
      const username = testLocalLogin.username;
      const password = "something";

      return localLoginValidator.create(username, password).then(
        (value: any) => {
          value.should.not.be.fulfilled;
        },
        (error: BlError) => {
          error.getMsg().should.contain("already exists");
        },
      );
    });

    it("should resolve with provider and providerId if username and password is valid", () => {
      const username = "amail@address.com";
      const password = "thisIsAValidPassword";

      return localLoginValidator.create(username, password).then(
        (providerAndProviderId: { provider: string; providerId: string }) => {
          providerAndProviderId.should.have
            .property("provider")
            .and.eq("local");

          providerAndProviderId.should.have
            .property("providerId")
            .and.have.length.gte(64);
        },
        (error: BlError) => {
          error.should.not.be.fulfilled;
        },
      );
    });
  });
});
