import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";

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
      new Strategy(this.getOptions(), (accessToken, done) => {
        done(null, { accessToken });
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
