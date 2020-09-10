import {Router} from 'express';
import * as passport from 'passport';
import {Strategy} from 'passport-facebook';
import {ApiPath} from '../../config/api-path';
import {SEResponseHandler} from '../../response/se.response.handler';
import {BlError} from '@wizardcoder/bl-model';
import {User} from '../../collections/user/user';
import {APP_CONFIG} from '../../application-config';
import {LocalLoginHandler} from '../local/local-login.handler';
import {UserProvider} from '../user/user-provider/user-provider';

export class FacebookAuth {
  private apiPath: ApiPath;
  private _localLoginHandler: LocalLoginHandler;
  private _userProvider: UserProvider;

  constructor(private router: Router, private resHandler: SEResponseHandler) {
    this.apiPath = new ApiPath();
    this._localLoginHandler = new LocalLoginHandler();
    this.createAuthGet(router);
    this.createCallbackGet(router);
    this.createPassportStrategy();
    this._userProvider = new UserProvider();
  }

  private createPassportStrategy() {
    passport.use(
      new Strategy(
        {
          clientID: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_SECRET,
          callbackURL:
            process.env.BL_API_URI +
            this.apiPath.createPath('auth/facebook/callback'),
          profileFields: ['id', 'email', 'name'],
          enableProof: true,
        },
        async (
          accessToken: any,
          refreshToken: any,
          profile: any,
          done: any,
        ) => {
          let provider = 'facebook';
          let providerId = profile.id;

          let username = '';

          if (profile.emails && profile.emails[0] && profile.emails[0].value) {
            username = profile.emails[0].value;
          }

          if (!username) {
            return done(
              null,
              null,
              new BlError('username not found from facebook').code(902),
            );
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

  private createAuthGet(router: Router) {
    router.get(
      this.apiPath.createPath('auth/facebook'),
      passport.authenticate(APP_CONFIG.login.facebook.name, {
        scope: ['public_profile', 'email'],
      }),
    );
  }

  private createCallbackGet(router: Router) {
    router.get(
      this.apiPath.createPath('auth/facebook/callback'),
      (req, res) => {
        passport.authenticate(
          APP_CONFIG.login.facebook.name,
          (err, tokens, blError: BlError) => {
            if (!tokens && (err || blError)) {
              return res.redirect(
                process.env.CLIENT_URI +
                  APP_CONFIG.path.client.auth.socialLoginFailure,
              );
            }

            if (tokens) {
              this.resHandler.sendAuthTokens(
                res,
                tokens.accessToken,
                tokens.refreshToken,
                this.apiPath.retrieveRefererPath(req.headers),
              );
            }
          },
        )(req, res);
      },
    );
  }
}
