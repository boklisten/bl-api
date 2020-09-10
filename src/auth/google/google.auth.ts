import {NextFunction, Response, Router, Request} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from 'passport';
import {ApiPath} from '../../config/api-path';
import {SEResponseHandler} from '../../response/se.response.handler';
import {BlError} from '@wizardcoder/bl-model';
import {User} from '../../collections/user/user';
import {APP_CONFIG} from '../../application-config';
import {UserProvider} from '../user/user-provider/user-provider';

export class GoogleAuth {
  private apiPath: ApiPath;
  private _userProvider: UserProvider;
  private _googlePassportStrategySettings;

  constructor(private router: Router, private resHandler: SEResponseHandler) {
    this.apiPath = new ApiPath();
    this.createAuthGet(router);
    this.createCallbackGet(router);
    this._userProvider = new UserProvider();

    this._googlePassportStrategySettings = {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      passReqToCallback: true,
      callbackURL:
        process.env.BL_API_URI +
        this.apiPath.createPath('auth/google/callback'),
    };

    this.createPassportStrategy();
  }

  private createPassportStrategy() {
    passport.use(
      new OAuth2Strategy(
        this._googlePassportStrategySettings,
        async (
          req,
          accessToken: any,
          refreshToken: any,
          profile: any,
          done: any,
        ) => {
          let provider = APP_CONFIG.login.google.name;
          let providerId = profile.id;
          let username;

          try {
            username = this.retrieveUsername(profile);
          } catch (e) {
            throw e;
          }

          if (!providerId) {
            return done(null, false, new BlError('no providerId').code(902));
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
              new BlError('could not create user').code(902),
            );
          }

          done(null, userAndTokens.tokens);
        },
      ),
    );
  }

  private retrieveUsername(profile): string {
    let username;

    for (let profileEmail of profile.emails) {
      if (profileEmail.verified) {
        username = profileEmail.value;
      }
    }

    if (!username || username.length <= 0) {
      throw new BlError('username not found by google').code(902);
    }

    return username;
  }

  private createAuthGet(router: Router) {
    router.get(
      this.apiPath.createPath('auth/google'),
      passport.authenticate(APP_CONFIG.login.google.name, {
        scope: ['profile', 'email'],
      }),
    );
  }

  private createCallbackGet(router: Router) {
    router.get(this.apiPath.createPath('auth/google/callback'), (req, res) => {
      passport.authenticate(
        APP_CONFIG.login.google.name,
        (err, tokens, blError: BlError) => {
          const resHandler = new SEResponseHandler();

          if (!tokens && (err || blError)) {
            return res.redirect(
              process.env.CLIENT_URI +
                APP_CONFIG.path.client.auth.socialLoginFailure,
            );
          }

          if (tokens) {
            return resHandler.sendAuthTokens(
              res,
              tokens.accessToken,
              tokens.refreshToken,
              this.apiPath.retrieveRefererPath(req.headers),
            );
          }
        },
      )(req, res);
    });
  }
}
