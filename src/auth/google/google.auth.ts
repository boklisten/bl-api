import {NextFunction, Response, Router, Request} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from 'passport';
import {ApiPath} from '../../config/api-path';
import {SEResponseHandler} from '../../response/se.response.handler';
import {BlError} from '@wizardcoder/bl-model';
import {TokenHandler} from '../token/token.handler';
import * as blConfig from '../../application-config';
import {UserHandler} from '../user/user.handler';
import {User} from '../../collections/user/user';
import {APP_CONFIG} from '../../application-config';
import {LocalLoginHandler} from '../local/local-login.handler';
import {UserProvider} from '../user/user-provider/user-provider';

export class GoogleAuth {
  private apiPath: ApiPath;
  private _localLoginHandler: LocalLoginHandler;
  private _userProvider: UserProvider;

  constructor(
    router: Router,
    private resHandler: SEResponseHandler,
    private tokenHandler: TokenHandler,
    private userHandler: UserHandler,
  ) {
    this.apiPath = new ApiPath();
    this.createAuthGet(router);
    this.createCallbackGet(router);
    this._localLoginHandler = new LocalLoginHandler();
    this._userProvider = new UserProvider();

    this.createPassportStrategy();
  }

  private createPassportStrategy() {
    passport.use(
      new OAuth2Strategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_SECRET,
          passReqToCallback: true,
          callbackURL:
            process.env.BL_API_URI +
            this.apiPath.createPath('auth/google/callback'),
        },
        async (
          req,
          accessToken: any,
          refreshToken: any,
          profile: any,
          done: any,
        ) => {
          let provider = blConfig.APP_CONFIG.login.google.name;
          let providerId = profile.id;
          let username = '';

          for (let profileEmail of profile.emails) {
            if (profileEmail.verified) {
              username = profileEmail.value;
            }
          }

          if (!username || username.length <= 0 || !providerId) {
            return done(
              null,
              false,
              new BlError('username not found by google')
                .code(902)
                .store('provider', provider)
                .store('providerId', providerId),
            );
          }

          let user;

          try {
            user = await this._userProvider.loginOrCreate(
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

          this.createTokens(username, done);
        },
      ),
    );
  }

  private createTokens(username, done) {
    this.tokenHandler.createTokens(username).then(
      (tokens: {accessToken: string; refreshToken: string}) => {
        done(null, tokens);
      },
      (createTokenErrors: BlError) => {
        createTokenErrors.printStack();

        return done(new BlError('could not create tokens').code(906));
      },
    );
  }

  private createAuthGet(router: Router) {
    router.get(
      this.apiPath.createPath('auth/google'),
      passport.authenticate(blConfig.APP_CONFIG.login.google.name, {
        scope: ['profile', 'email'],
      }),
    );
  }

  private createCallbackGet(router: Router) {
    router.get(this.apiPath.createPath('auth/google/callback'), (req, res) => {
      passport.authenticate(
        blConfig.APP_CONFIG.login.google.name,
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
