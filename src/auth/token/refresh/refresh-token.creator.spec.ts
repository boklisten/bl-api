// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { RefreshTokenCreator } from "./refresh-token.creator";
import { BlError } from "@boklisten/bl-model";
import { RefreshToken } from "./refresh-token";
import { TokenConfig } from "../token.config";
import { AccessToken } from "../access-token/access-token";

chai.use(chaiAsPromised);

describe("RefreshTokenCreator", () => {
  const refreshTokenConfig: RefreshToken = {
    iss: "",
    aud: "",
    expiresIn: "12h",
    iat: 0,
    sub: "",
    username: "",
  };

  const accessTokenConfig: AccessToken = {
    iss: "",
    aud: "",
    expiresIn: "30s",
    iat: 0,
    sub: "",
    username: "",
    permission: "customer",
    details: "",
  };

  const tokenConfig = new TokenConfig(accessTokenConfig, refreshTokenConfig);

  const refreshTokenCreator = new RefreshTokenCreator(tokenConfig);

  describe("createRefreshToken()", () => {
    let testUsername = "";
    let testUserid = "";

    beforeEach(() => {
      testUsername = "bill@oriley.co";
      testUserid = "abc1";
    });

    describe("should reject with BlError when", () => {
      it("username is undefined", (done) => {
        const username = undefined;
        refreshTokenCreator
          .create(username, testUserid)
          .catch((blError: BlError) => {
            blError.getCode().should.be.eq(103);
            done();
          });
      });

      it("userid is null", (done) => {
        const userid = null;
        refreshTokenCreator
          .create(testUserid, userid)
          .catch((blError: BlError) => {
            blError.getCode().should.be.eq(103);
            done();
          });
      });
    });

    describe("should resolve with a RefreshToken when", () => {
      it("username is bill@meathome.se and userid is valid", (done) => {
        const username = "bill@meathome.se";
        refreshTokenCreator
          .create(username, testUserid)
          .then((refreshToken) => {
            refreshToken.should.be.a("string").and.have.length.gte(50);
            done();
          })
          .catch((err) => {});
      });
    });
  });
});
