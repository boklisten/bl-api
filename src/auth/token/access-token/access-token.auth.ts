// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import passport from "passport";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ExtractJwt, Strategy } from "passport-jwt";

import { AccessToken } from "./access-token";
import { AccessTokenSecret } from "./access-token.secret";
import { SEToken } from "../se.token";
import { TokenConfig } from "../token.config";

export class AccessTokenAuth {
  private accessTokenSecret: AccessTokenSecret;
  private tokenConfig: TokenConfig;

  constructor() {
    new SEToken();
    this.accessTokenSecret = new AccessTokenSecret();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const appTokenConfig = require("../../../application-config").APP_CONFIG
      .token;
    this.tokenConfig = new TokenConfig(
      appTokenConfig.access,
      appTokenConfig.refresh,
    );

    passport.use(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      new Strategy(this.getOptions(), (accessToken: AccessToken, done) => {
        done(null, { accessToken: accessToken });
      }),
    );
  }

  private getOptions() {
    return {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: this.accessTokenSecret.get(),
      issuer: this.tokenConfig.accessToken.iss,
      audience: this.tokenConfig.accessToken.aud,
    };
  }
}
