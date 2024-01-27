import { BlError } from "@boklisten/bl-model";
import { Router } from "express";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import passport from "passport";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { OAuth2Strategy } from "passport-google-oauth";

import { APP_CONFIG } from "../../application-config";
import { ApiPath } from "../../config/api-path";
import { SEResponseHandler } from "../../response/se.response.handler";
import { UserProvider } from "../user/user-provider/user-provider";

export class GoogleAuth {
  private apiPath: ApiPath;
  private _userProvider: UserProvider;
  private _googlePassportStrategySettings;

  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private router: Router,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private resHandler: SEResponseHandler,
  ) {
    this.apiPath = new ApiPath();
    this.createAuthGet(router);
    this.createCallbackGet(router);
    this._userProvider = new UserProvider();

    this._googlePassportStrategySettings = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      clientID: process.env.GOOGLE_CLIENT_ID,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      clientSecret: process.env.GOOGLE_SECRET,
      passReqToCallback: true,
      callbackURL:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        process.env.BL_API_URI +
        this.apiPath.createPath("auth/google/callback"),
    };

    this.createPassportStrategy();
  }

  private createPassportStrategy() {
    passport.use(
      new OAuth2Strategy(
        this._googlePassportStrategySettings,
        async (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          req: unknown,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          accessToken: unknown,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          refreshToken: unknown,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          profile: any,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          done: any,
        ) => {
          const provider = APP_CONFIG.login.google.name;
          const providerId = profile.id;
          const username = this.retrieveUsername(profile);

          if (!providerId) {
            return done(null, false, new BlError("no providerId").code(902));
          }

          let userAndTokens;

          try {
            userAndTokens = await this._userProvider.loginOrCreate(
              username,
              provider,
              providerId,
            );
          } catch (e) {
            return done(
              null,
              null,
              new BlError("could not create user").code(902),
            );
          }

          done(null, userAndTokens.tokens);
        },
      ),
    );
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private retrieveUsername(profile): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const username = profile.emails.find((email) => email.verified)?.value;

    if (!username || username.length <= 0) {
      throw new BlError("username not found by google").code(902);
    }

    return username;
  }

  private createAuthGet(router: Router) {
    router.get(
      this.apiPath.createPath("auth/google"),
      passport.authenticate(APP_CONFIG.login.google.name, {
        scope: ["profile", "email"],
      }),
    );
  }

  private createCallbackGet(router: Router) {
    router.get(this.apiPath.createPath("auth/google/callback"), (req, res) => {
      passport.authenticate(
        APP_CONFIG.login.google.name, // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (err, tokens, blError: BlError) => {
          const resHandler = new SEResponseHandler();

          if (!tokens && (err || blError)) {
            return res.redirect(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              process.env.CLIENT_URI +
                APP_CONFIG.path.client.auth.socialLoginFailure,
            );
          }

          if (tokens) {
            return resHandler.sendAuthTokens(
              res,
              tokens.accessToken,
              tokens.refreshToken,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              this.apiPath.retrieveRefererPath(req.headers),
            );
          }
        },
      )(req, res);
    });
  }
}
