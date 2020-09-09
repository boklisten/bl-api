import {User} from '../../../collections/user/user';
import {UserHandler} from '../user.handler';
import {LocalLoginHandler} from '../../local/local-login.handler';

export class UserProvider {
  constructor(
    private _userHandler?: UserHandler,
    private _localLoginHandler?: LocalLoginHandler,
  ) {
    this._userHandler = _userHandler ? _userHandler : new UserHandler();

    this._localLoginHandler = _localLoginHandler
      ? _localLoginHandler
      : new LocalLoginHandler();
  }

  public async loginOrCreate(
    username: string,
    provider: string,
    providerId: string,
  ): Promise<User> {
    let user;

    try {
      user = await this.getUser(username, provider, providerId);
      await this._userHandler.valid(username);
      await this._localLoginHandler.createDefaultLocalLoginIfNoneIsFound(
        username,
      );
    } catch (e) {
      throw e;
    }

    return user;
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
      try {
        user = await this._userHandler.create(username, provider, providerId);
      } catch (createUserError) {
        throw createUserError;
      }
    }

    return user;
  }
}
