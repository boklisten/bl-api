import { BlError } from "@boklisten/bl-model";
import { Router } from "express";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import passport from "passport";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Strategy } from "passport-facebook";

import { APP_CONFIG } from "../../application-config";
import { ApiPath } from "../../config/api-path";
import { SEResponseHandler } from "../../response/se.response.handler";
import { UserProvider } from "../user/user-provider/user-provider";

export class FacebookAuth {
  private apiPath: ApiPath;
  private _userProvider: UserProvider;
  private facebookPassportStrategySettings;

  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private router: Router,
    private resHandler: SEResponseHandler,
  ) {
    this.apiPath = new ApiPath();

    this.facebookPassportStrategySettings = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      clientID: process.env.FACEBOOK_CLIENT_ID,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        process.env.BL_API_URI +
        this.apiPath.createPath("auth/facebook/callback"),
      profileFields: ["id", "email", "name"],
      enableProof: true,
    };

    this.createAuthGet(router);
    this.createCallbackGet(router);
    this.createPassportStrategy();
    this._userProvider = new UserProvider();
  }

  private createPassportStrategy() {
    passport.use(
      new Strategy(
        this.facebookPassportStrategySettings,
        async (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          accessToken: unknown,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          refreshToken: unknown,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          profile: any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          done: any,
        ) => {
          const provider = APP_CONFIG.login.facebook.name;
          const providerId = profile.id;

          let userAndTokens;

          try {
            const username = this.extractUsername(profile);
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
  private extractUsername(profile): string {
    let username: string;

    if (profile.emails && profile.emails[0] && profile.emails[0].value) {
      username = profile.emails[0].value;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!username) {
      throw new BlError("username not found from facebook").code(902);
    }

    return username;
  }

  private createAuthGet(router: Router) {
    router.get(
      this.apiPath.createPath("auth/facebook"),
      passport.authenticate(APP_CONFIG.login.facebook.name, {
        scope: ["public_profile", "email"],
      }),
    );
  }

  private createCallbackGet(router: Router) {
    router.get(
      this.apiPath.createPath("auth/facebook/callback"),
      (req, res) => {
        passport.authenticate(
          APP_CONFIG.login.facebook.name, // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          (err, tokens, blError: BlError) => {
            if (!tokens && (err || blError)) {
              return res.redirect(
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                process.env.CLIENT_URI +
                  APP_CONFIG.path.client.auth.socialLoginFailure,
              );
            }

            if (tokens) {
              this.resHandler.sendAuthTokens(
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
      },
    );
  }
}
