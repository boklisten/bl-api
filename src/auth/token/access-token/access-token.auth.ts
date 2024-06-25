import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AccessToken } from "./access-token";
import { AccessTokenSecret } from "./access-token.secret";
import { APP_CONFIG } from "../../../application-config";
import { RefreshToken } from "../refresh/refresh-token";
import { SEToken } from "../se.token";
import { TokenConfig } from "../token.config";

export class AccessTokenAuth {
  private accessTokenSecret: AccessTokenSecret;
  private tokenConfig: TokenConfig;

  constructor() {
    new SEToken();
    this.accessTokenSecret = new AccessTokenSecret();
    this.tokenConfig = new TokenConfig(
      APP_CONFIG.token.access as AccessToken,
      APP_CONFIG.token.refresh as RefreshToken,
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
