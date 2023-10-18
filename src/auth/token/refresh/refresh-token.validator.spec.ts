import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { RefreshTokenValidator } from "./refresh-token.validator";
import { BlError } from "@boklisten/bl-model";
import { RefreshTokenCreator } from "./refresh-token.creator";
import { RefreshToken } from "./refresh-token";
import { TokenConfig } from "../token.config";
import { AccessToken } from "../access-token/access-token";

chai.use(chaiAsPromised);

describe("RefreshTokenValidator", () => {
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

  const refreshTokenValidator = new RefreshTokenValidator();

  describe("validateRefreshToken()", () => {
    it("should reject with BlError when refreshToken is empty", () => {
      const refreshToken = "";
      return refreshTokenValidator
        .validate(refreshToken)
        .should.be.rejectedWith(BlError);
    });

    it("should reject with BlError when refreshToken is not valid", (done) => {
      const refreshToken = "this is not a valid token";
      refreshTokenValidator.validate(refreshToken).then(
        (valid: boolean) => {
          valid.should.not.be.fulfilled;
          done();
        },
        (error: BlError) => {
          error.getCode().should.be.eq(909);
          done();
        },
      );
    });

    context("when refreshToken is expired", () => {
      it("should reject with BlCode 909", (done) => {
        const jwt = require("jsonwebtoken");

        jwt.sign(
          { username: "test", iat: Math.floor(Date.now() / 1000) - 10000 },
          "test",
          { expiresIn: "1s" },
          (error, refreshToken) => {
            refreshTokenValidator
              .validate(refreshToken)
              .catch((rtokenError: BlError) => {
                rtokenError.getCode().should.be.eql(909);
                done();
              });
          },
        );
      });
    });

    context("when refreshToken is valid", () => {
      it("should resolve with payload", (done) => {
        const username = "bill@hicks.com";
        const userid = "abc";

        refreshTokenCreator.create(username, userid).then(
          (refreshToken: string) => {
            refreshTokenValidator.validate(refreshToken).then(
              (refreshToken: RefreshToken) => {
                refreshToken.aud.should.be.eq(tokenConfig.refreshToken.aud);
                refreshToken.iss.should.be.eq(tokenConfig.refreshToken.iss);

                done();
              },
              (error) => {
                error.should.not.be.fulfilled;
                done();
              },
            );
          },
          (error) => {
            error.should.not.be.fulfilled;
            done();
          },
        );
      });
    });
  });
});
