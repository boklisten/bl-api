import {BlError} from '@wizardcoder/bl-model';
import {RefreshTokenCreator} from './refresh/refresh-token.creator';
import {AccessTokenCreator} from './access-token/access-token.creator';
import {UserHandler} from '../user/user.handler';
import {User} from '../../collections/user/user';
import {TokenConfig} from './token.config';
import {APP_CONFIG} from '../../application-config';
import {AccessToken} from './access-token/access-token';
import {RefreshToken} from './refresh/refresh-token';

export class TokenHandler {
  private refreshTokenCreator: RefreshTokenCreator;
  private accessTokenCreator: AccessTokenCreator;

  constructor(private userHandler: UserHandler) {
    const tokenConfig = new TokenConfig(
      APP_CONFIG.token.access as AccessToken,
      APP_CONFIG.token.refresh as RefreshToken,
    );

    this.refreshTokenCreator = new RefreshTokenCreator(tokenConfig);
    this.accessTokenCreator = new AccessTokenCreator(tokenConfig);
  }

  public createTokens(
    username: string,
  ): Promise<{accessToken: string; refreshToken: string}> {
    return new Promise((resolve, reject) => {
      this.userHandler.getByUsername(username).then(
        (theUser: User) => {
          let user = theUser;

          this.userHandler
            .valid(username)
            .then(() => {
              this.refreshTokenCreator.create(user.username, user.blid).then(
                (refreshToken: string) => {
                  this.accessTokenCreator
                    .create(
                      user.username,
                      user.blid,
                      user.permission,
                      user.userDetail,
                      refreshToken,
                    )
                    .then(
                      (accessToken: string) => {
                        resolve({
                          accessToken: accessToken,
                          refreshToken: refreshToken,
                        });
                      },
                      (accessTokenCreationError: BlError) => {
                        reject(
                          new BlError('failed to create accessToken')
                            .code(906)
                            .add(accessTokenCreationError),
                        );
                      },
                    );
                },
                (refreshTokenCreatorError: BlError) => {
                  reject(
                    new BlError('failed to create refreshToken')
                      .code(906)
                      .add(refreshTokenCreatorError),
                  );
                },
              );
            })
            .catch((userValidError: BlError) => {
              reject(
                new BlError('user is not valid').add(userValidError).code(902),
              );
            });
        },
        (getUserError: BlError) => {
          reject(
            new BlError('could not get user with username "' + username + '"')
              .add(getUserError)
              .code(906),
          );
        },
      );
    });
  }
}
