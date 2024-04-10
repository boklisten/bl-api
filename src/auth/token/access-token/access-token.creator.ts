import { BlError, UserPermission } from "@boklisten/bl-model";

import { AccessTokenSecret } from "./access-token.secret";
import { RefreshTokenValidator } from "../refresh/refresh-token.validator";
import { TokenConfig } from "../token.config";

export class AccessTokenCreator {
  private refreshTokenValidator: RefreshTokenValidator;
  private accessTokenSecret: AccessTokenSecret;
  private jwt = require("jsonwebtoken");

  constructor(private tokenConfig: TokenConfig) {
    this.refreshTokenValidator = new RefreshTokenValidator();
    this.accessTokenSecret = new AccessTokenSecret();
  }

  public create(
    username: string,
    userid: string,
    permission: UserPermission,
    userDetailId: string,
    refreshToken: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!username || !userid || !refreshToken)
        return reject(
          new BlError("parameter is empty or undefined")
            .className("TokenHandler")
            .methodName("createAccessToken"),
        );

      this.refreshTokenValidator.validate(refreshToken).then(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (valid: boolean) => {
          this.jwt.sign(
            this.createPayload(username, userid, permission, userDetailId),
            this.accessTokenSecret.get(),
            { expiresIn: this.tokenConfig.accessToken.expiresIn },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error: any, accessToken: any) => {
              if (error)
                return reject(
                  new BlError("could not sign jwt")
                    .store("usename", username)
                    .store("permission", permission)
                    .code(905),
                );

              return resolve(accessToken);
            },
          );
        },
        (refreshTokenError: BlError) => {
          reject(
            new BlError("refreshToken is not valid")
              .add(refreshTokenError)
              .code(905),
          );
        },
      );
    });
  }

  private createPayload(
    username: string,
    userid: string,
    permission: UserPermission,
    userDetailId: string,
  ) {
    return {
      iss: this.tokenConfig.accessToken.iss,
      aud: this.tokenConfig.accessToken.aud,
      iat: Math.floor(Date.now() / 1000),
      sub: userid,
      username: username,
      permission: permission,
      details: userDetailId,
    };
  }
}
