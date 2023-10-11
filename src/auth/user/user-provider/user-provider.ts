import { User } from "../../../collections/user/user";
import { LocalLoginHandler } from "../../local/local-login.handler";
import { TokenHandler } from "../../token/token.handler";
import { UserHandler } from "../user.handler";

export class UserProvider {
  constructor(
    private _userHandler?: UserHandler,
    private _localLoginHandler?: LocalLoginHandler,
    private _tokenHandler?: TokenHandler,
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
    providerId: string,
  ): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const user = await this.getUser(username, provider, providerId);
    await this._userHandler.valid(username);
    await this._localLoginHandler.createDefaultLocalLoginIfNoneIsFound(
      username,
    );
    const tokens = await this._tokenHandler.createTokens(username);

    return { user: user, tokens: tokens };
  }

  private async getUser(
    username: string,
    provider: string,
    providerId: string,
  ): Promise<User> {
    let user;
    try {
      user = await this._userHandler.get(provider, providerId);
    } catch (e) {
      user = await this._userHandler.create(username, provider, providerId);
    }

    return user;
  }
}
