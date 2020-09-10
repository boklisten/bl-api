import * as passport from 'passport';
import * as OAuth2Strategy from 'passport-oauth2';
import {ApiPath} from '../../config/api-path';
import {Router} from 'express';
import {APP_CONFIG} from '../../application-config';
import {BlError} from '@wizardcoder/bl-model';
import {HttpHandler} from '../../http/http.handler';
import {UserHandler} from '../user/user.handler';
import {TokenHandler} from '../token/token.handler';
import {SEResponseHandler} from '../../response/se.response.handler';
import {User} from '../../collections/user/user';
import {LocalLoginHandler} from '../local/local-login.handler';
import {UserProvider} from '../user/user-provider/user-provider';

export class FeideAuth {
  private apiPath: ApiPath;
  private httpHandler: HttpHandler;
  private _userProvider: UserProvider;

  constructor(
    router: Router,
    private resHandler: SEResponseHandler,
    private tokenHandler: TokenHandler,
    private userHandler: UserHandler,
  ) {
    this.apiPath = new ApiPath();
    this.createPassportStrategy();
    this.createAuthGet(router);
    this.createCallbackGet(router);
    this.httpHandler = new HttpHandler();
    this._userProvider = new UserProvider();
  }

  private createPassportStrategy() {
    passport.use(
      new OAuth2Strategy(
        {
          authorizationURL: process.env.FEIDE_AUTHORIZATION_URL,
          tokenURL: process.env.FEIDE_TOKEN_URL,
          clientID: process.env.FEIDE_CLIENT_ID,
          clientSecret: process.env.FEIDE_SECRET,
          callbackURL:
            process.env.BL_API_URI +
            this.apiPath.createPath('auth/feide/callback'),
        },
        async (feideAccessToken, refreshToken, profile, done) => {
          let feideUserInfo;

          try {
            feideUserInfo = await this.httpHandler.get(
              process.env.FEIDE_USER_INFO_URL,
              'Bearer ' + feideAccessToken,
            );
          } catch (e) {
            done(new Error('something went wrong with feide login'));
          }

          const feideUser = feideUserInfo['user'];
          const feideEmail = feideUser['email'];
          const feideName = feideUser['name'];
          const feideUserId = feideUser['userid'];
          const provider = APP_CONFIG.login.feide.name;

          let user;

          try {
            user = await this._userProvider.loginOrCreate(
              feideEmail,
              provider,
              feideUserId,
            );
          } catch (e) {
            return done(
              null,
              null,
              new BlError('could not create user').code(902),
            );
          }

          this.createTokens(feideEmail, done);
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
      this.apiPath.createPath('auth/feide'),
      passport.authenticate(APP_CONFIG.login.feide.name, {
        scope: ['profile', 'email', 'userid'],
      }),
    );
  }

  private createCallbackGet(router: Router) {
    router.get(this.apiPath.createPath('auth/feide/callback'), (req, res) => {
      passport.authenticate(
        APP_CONFIG.login.feide.name,
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
    });
  }
}
