import "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { HashedPasswordGenerator } from "./hashed-password-generator";
import { SaltGenerator } from "../salt/salt-generator";
import { BlError } from "@wizardcoder/bl-model";
import { isNullOrUndefined } from "util";
import { SeCrypto } from "../../../crypto/se.crypto";

chai.use(chaiAsPromised);

describe("HashedPasswordGenerator", () => {
  let saltGenerator = new SaltGenerator();
  let seCrypto = new SeCrypto();
  let hashedPasswordGenerator = new HashedPasswordGenerator(
    saltGenerator,
    seCrypto
  );

  describe("generate()", () => {
    describe("should reject with BlError when", () => {
      it("password is empty", () => {
        let password = "";
        return hashedPasswordGenerator
          .generate(password)
          .should.be.rejectedWith(BlError);
      });

      it("password is undefined", () => {
        let password = undefined;
        return hashedPasswordGenerator
          .generate(password)
          .should.be.rejectedWith(BlError);
      });
    });

    describe("should return a object with", () => {
      let password = "thisPasswordIsValid";

      it("a property hashedPassword of type string", () => {
        return hashedPasswordGenerator.generate(password).then(
          (hashedPasswordAndSalt: { hashedPassword: string; salt: string }) => {
            hashedPasswordAndSalt.should.have
              .property("hashedPassword")
              .and.be.a("string");

            hashedPasswordAndSalt.should.have
              .property("salt")
              .and.be.a("string");
          },
          (error: any) => {}
        );
      });
    });
  });
});
