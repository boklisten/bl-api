import * as passport from "passport";
import { Strategy } from "passport-openid";
import { ApiPath } from "../../config/api-path";
import { Router } from "express";
import { APP_CONFIG } from "../../application-config";
import { BlError } from "@wizardcoder/bl-model";

import { SEResponseHandler } from "../../response/se.response.handler";

export class FeideAuth {
  private apiPath: ApiPath;

  constructor(router: Router, private resHandler: SEResponseHandler) {
    this.apiPath = new ApiPath();

    this.createPassportStrategy();
    this.createAuthGet(router);
    this.createCallbackGet(router);
  }

  private createPassportStrategy() {
    passport.use(
      new Strategy(
        {
          returnURL:
            process.env.BL_API_URI +
            this.apiPath.createPath("auth/feide/callback"),
          realm: process.env.BL_API_URI,
          profile: true,
          identifierField: "openid-feide",
          passReqToCallback: true
        },
        (req, identifier: string, profile, done: Function) => {
          console.log("req", req);
          console.log("identifier", identifier);
          done(null, { identifier: identifier });
        }
      )
    );
  }

  private createAuthGet(router: Router) {
    router.get(
      this.apiPath.createPath("auth/feide"),
      passport.authenticate(APP_CONFIG.login.feide.name)
    );
  }

  private createCallbackGet(router: Router) {
    router.get(this.apiPath.createPath("auth/feide/callback"), (req, res) => {
      passport.authtenticate(
        APP_CONFIG.login.feide.name,
        (err, tokens, blError: BlError) => {
          console.log("err", err, "tokens", tokens, "blError", blError);
          if (!tokens && (err || blError)) {
            return res.redirect(
              process.env.CLIENT_URI +
                APP_CONFIG.path.client.auth.socialLoginFailure
            );
          }

          if (tokens) {
            this.resHandler.sendAuthTokens(
              res,
              tokens.accessToken,
              tokens.refreshToken,
              this.apiPath.retrieveRefererPath(req.headers)
            );
          }
        }
      )(req, res);
    });
  }
}
