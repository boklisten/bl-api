import { BlError } from "@boklisten/bl-model";
import isEmail from "validator/lib/isEmail";
import { RefreshTokenSecret } from "./refresh-token.secret";
import { TokenConfig } from "../token.config";

export class RefreshTokenCreator {
  private jwt = require("jsonwebtoken");
  private refreshTokenSecret: RefreshTokenSecret;

  constructor(private tokenConfig: TokenConfig) {
    this.refreshTokenSecret = new RefreshTokenSecret();
  }

  public create(username: string, userid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const blError = new BlError("")
        .className("TokenHandler")
        .methodName("createRefreshToken")
        .store("username", username)
        .store("userid", userid);

      if (!username || !isEmail(username))
        return reject(
          blError.msg("username is undefined or not an email").code(103)
        );
      if (!userid || userid.length <= 0)
        return reject(blError.msg("userid is empty or undefined").code(103));

      this.jwt.sign(
        this.createPayload(username, userid),
        this.refreshTokenSecret.get(),
        { expiresIn: this.tokenConfig.refreshToken.expiresIn },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error: any, refreshToken: string) => {
          if (error)
            return reject(
              blError.msg("could not create refreshToken").code(906)
            );
          resolve(refreshToken);
        }
      );
    });
  }

  private createPayload(username: string, userid: string) {
    return {
      iss: this.tokenConfig.refreshToken.iss,
      aud: this.tokenConfig.refreshToken.aud,
      iat: Math.floor(Date.now() / 1000),
      sub: userid,
      username: username,
    };
  }
}
