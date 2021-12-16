// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { LocalLoginCreator } from "./local-login-creator";
import { BlError } from "@boklisten/bl-model";
import { HashedPasswordGenerator } from "../password/hashed-password-generator";
import { SaltGenerator } from "../salt/salt-generator";
import { SeCrypto } from "../../../crypto/se.crypto";
import { ProviderIdGenerator } from "../provider-id/provider-id-generator";
import { LocalLogin } from "../../../collections/local-login/local-login";

chai.use(chaiAsPromised);

describe("LocalLoginCreator", () => {
  const saltGenerator = new SaltGenerator();
  const seCrypto = new SeCrypto();
  const hashedPasswordGenerator = new HashedPasswordGenerator(
    saltGenerator,
    seCrypto
  );
  const providerIdGenerator = new ProviderIdGenerator(seCrypto);
  const localLoginCreator = new LocalLoginCreator(
    hashedPasswordGenerator,
    providerIdGenerator
  );

  describe("create()", () => {
    describe("should reject with BlError when", () => {
      it("username is empty", () => {
        const username = "";
        const password = "thisIsAValidPassword";
        return localLoginCreator
          .create(username, password)
          .should.be.rejectedWith(BlError);
      });

      it("username is undefined", () => {
        const username = undefined;
        const password = "thisisavalidpassword";
        return localLoginCreator
          .create(username, password)
          .should.be.rejectedWith(BlError);
      });

      it("password is null", () => {
        const username = "bill@mail.com";
        const password = null;
        return localLoginCreator
          .create(username, password)
          .should.be.rejectedWith(BlError);
      });

      it("password is under 6 char", () => {
        const username = "bill@gmail.com";
        const password = "abc";

        return localLoginCreator
          .create(username, password)
          .should.be.rejectedWith(BlError);
      });
    });

    describe("should resolve with a LocalLogin object when", () => {
      it("username and password is valid", () => {
        const username = "bill@mail.com";
        const password = "thisIsAValidPassword";

        return localLoginCreator.create(username, password).then(
          (localLogin: LocalLogin) => {
            localLogin.should.have.property("username").and.be.eq(username);

            localLogin.should.have
              .property("salt")
              .and.have.length.greaterThan(10)
              .and.be.a("string");

            localLogin.should.have
              .property("providerId")
              .and.have.length.greaterThan(10)
              .and.be.a("string");

            localLogin.should.have.property("provider").and.be.eq("local");

            localLogin.should.have
              .property("hashedPassword")
              .and.have.length.gte(64);
          },
          (error: any) => {}
        );
      });
    });
  });
});
