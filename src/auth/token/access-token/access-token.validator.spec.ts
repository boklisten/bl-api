// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { AccessTokenValidator } from "./access-token.validator";
import { BlError } from "@boklisten/bl-model";
import { UserPermission } from "../../user/user-permission";
import { RefreshTokenCreator } from "../refresh/refresh-token.creator";
import { AccessTokenCreator } from "./access-token.creator";
import { AccessToken } from "./access-token";
import { RefreshToken } from "../refresh/refresh-token";
import { TokenConfig } from "../token.config";

chai.use(chaiAsPromised);

describe("", () => {
  const refreshTokenConfig: RefreshToken = {
    iss: "boklisten.co",
    aud: "boklisten.co",
    expiresIn: "12h",
    iat: 0,
    sub: "",
    username: "",
  };

  const accessTokenConfig: AccessToken = {
    iss: "boklisten.co",
    aud: "boklisten.co",
    expiresIn: "30s",
    iat: 0,
    sub: "",
    username: "",
    permission: "customer",
    details: "",
  };

  const tokenConfig = new TokenConfig(accessTokenConfig, refreshTokenConfig);
  const accessTokenValidator = new AccessTokenValidator();
  const refreshTokenCreator = new RefreshTokenCreator(tokenConfig);
  const accessTokenCreator = new AccessTokenCreator(tokenConfig);

  describe("validate()", () => {
    context("when accessToken is empty or undefined", () => {
      it("should reject with BlError", () => {
        return accessTokenValidator
          .validate("")
          .should.be.rejectedWith(BlError);
      });
    });

    context("when accessToken is not valid", () => {
      it("should reject with BlError code 905", (done) => {
        accessTokenValidator
          .validate("this is not valid")
          .catch((error: BlError) => {
            error.getCode().should.be.eq(910);
            done();
          });
      });
    });

    context("when accessToken is expired", () => {
      it("should reject with BlError code 910", (done) => {
        const username = "bill@butt.com";
        const jwt = require("jsonwebtoken");

        jwt.sign(
          {
            username: username,
            iat: Math.floor(Date.now() / 1000) - 10000,
          },
          "test",
          { expiresIn: "1s" },
          (error, accessToken) => {
            accessTokenValidator
              .validate(accessToken)
              .catch((error: BlError) => {
                error.getCode().should.be.eq(910);
                done();
              });
          },
        );
      });
    });

    context("when accessToken is valid", () => {
      it("should resolve with a payload", (done) => {
        const username = "bill@anderson.com";
        const userid = "123";
        const permission: UserPermission = "admin";
        const userDetailId = "abc";
        refreshTokenCreator
          .create(username, userid)
          .then((refreshToken: string) => {
            accessTokenCreator
              .create(username, userid, permission, userDetailId, refreshToken)
              .then((accessToken: string) => {
                accessTokenValidator
                  .validate(accessToken)
                  .then((payload: AccessToken) => {
                    expect(payload.username).to.eq(username);
                    expect(payload.aud).to.eq(accessTokenConfig.aud);
                    done();
                  });
              });
          });
      });
    });
  });
});
