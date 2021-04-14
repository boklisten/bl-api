// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { ProviderIdGenerator } from "./provider-id-generator";
import { BlError } from "@boklisten/bl-model";
import { SeCrypto } from "../../../crypto/se.crypto";

chai.use(chaiAsPromised);

describe("ProviderIdGenerator", () => {
  describe("generate()", () => {
    let seCrypto = new SeCrypto();
    let providerIdGenerator = new ProviderIdGenerator(seCrypto);

    describe("should reject with BlError when", () => {
      it("username is empty", () => {
        let username = "";
        return providerIdGenerator
          .generate(username)
          .should.be.rejectedWith(BlError);
      });

      it("username is undefined", () => {
        let username = undefined;
        return providerIdGenerator
          .generate(username)
          .should.be.rejectedWith(BlError);
      });
    });

    describe("should return a providerId when", () => {
      it("usename is valid", () => {
        let username = "bill@mail.com";
        return providerIdGenerator
          .generate(username)
          .should.eventually.be.fulfilled.and.be.a("string")
          .and.have.length.greaterThan(63);
      });
    });
  });
});
