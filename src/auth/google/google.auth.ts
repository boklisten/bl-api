import { BlError } from "@boklisten/bl-model";
import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

import { APP_CONFIG } from "../../application-config";
import { ApiPath } from "../../config/api-path";
import { SEResponseHandler } from "../../response/se.response.handler";
import { UserProvider } from "../user/user-provider/user-provider";

export class GoogleAuth {
  private apiPath: ApiPath;
  private _userProvider: UserProvider;

  constructor(
    private router: Router,
    private resHandler: SEResponseHandler,
  ) {
    this.apiPath = new ApiPath();
    this.createAuthGet(router);
    this.createCallbackGet(router);
    this._userProvider = new UserProvider();

    this.createPassportStrategy();
  }

  private createPassportStrategy() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env["GOOGLE_CLIENT_ID"] ?? "",
          clientSecret: process.env["GOOGLE_SECRET"] ?? "",
          passReqToCallback: true,
          callbackURL:
            process.env["BL_API_URI"] +
            this.apiPath.createPath("auth/google/callback"),
        },
        async (req, accessToken, refreshToken, profile, done) => {
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
              undefined,
              new BlError("could not create user").code(902),
            );
          }

          done(null, userAndTokens.tokens);
        },
      ),
    );
  }

  private retrieveUsername(profile: Profile): string {
    const username = profile.emails?.find((email) => email.verified)?.value;

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
              process.env["CLIENT_URI"] +
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
