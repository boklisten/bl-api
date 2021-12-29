import { User } from "../../../collections/user/user";
import { UserHandler } from "../user.handler";
import { LocalLoginHandler } from "../../local/local-login.handler";
import { TokenHandler } from "../../token/token.handler";

export class UserProvider {
  constructor(
    private _userHandler?: UserHandler,
    private _localLoginHandler?: LocalLoginHandler,
    private _tokenHandler?: TokenHandler
  ) {
    this._userHandler = _userHandler ? _userHandler : new UserHandler();

    this._localLoginHandler = _localLoginHandler
      ? _localLoginHandler
      : new LocalLoginHandler();

    this._tokenHandler = _tokenHandler
      ? _tokenHandler
      : new TokenHandler(this._userHandler);
  }

  public async loginOrCreate(
    username: string,
    provider: string,
    providerId: string
  ): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    let user;
    let tokens;

    // eslint-disable-next-line no-useless-catch
    try {
      user = await this.getUser(username, provider, providerId);
      await this._userHandler.valid(username);
      await this._localLoginHandler.createDefaultLocalLoginIfNoneIsFound(
        username
      );
      tokens = await this._tokenHandler.createTokens(username);
    } catch (e) {
      throw e;
    }

    return { user: user, tokens: tokens };
  }

  private async getUser(
    username: string,
    provider: string,
    providerId: string
  ): Promise<User> {
    let user;
    try {
      user = await this._userHandler.get(provider, providerId);
    } catch (e) {
      // eslint-disable-next-line no-useless-catch
      try {
        user = await this._userHandler.create(username, provider, providerId);
      } catch (createUserError) {
        throw createUserError;
      }
    }

    return user;
  }
}
