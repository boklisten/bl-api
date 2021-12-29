import { SEToken } from "../se.token";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { UserHandler } from "../../user/user.handler";
import { AccessTokenSecret } from "./access-token.secret";
import { TokenConfig } from "../token.config";
import { AccessToken } from "./access-token";

export class AccessTokenAuth {
  private accessTokenSecret: AccessTokenSecret;
  private tokenConfig: TokenConfig;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(userHandler: UserHandler) {
    new SEToken();
    this.accessTokenSecret = new AccessTokenSecret();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const appTokenConfig = require("../../../application-config").APP_CONFIG
      .token;
    this.tokenConfig = new TokenConfig(
      appTokenConfig.access,
      appTokenConfig.refresh
    );

    passport.use(
      new Strategy(this.getOptions(), (accessToken: AccessToken, done) => {
        done(null, { accessToken: accessToken });
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getOptions(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opts: any = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = this.accessTokenSecret.get();
    opts.issuer = this.tokenConfig.accessToken.iss;
    opts.audience = this.tokenConfig.accessToken.aud;

    return opts;
  }
}
