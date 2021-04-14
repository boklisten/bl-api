import { RefreshToken } from "./refresh/refresh-token";
import { AccessToken } from "./access-token/access-token";

export class TokenConfig {
  constructor(
    private _accessToken: AccessToken,
    private _refreshToken: RefreshToken
  ) {}

  set refreshToken(refreshToken: RefreshToken) {
    this._refreshToken = refreshToken;
  }

  get refreshToken(): RefreshToken {
    return this._refreshToken;
  }

  set accessToken(accessToken: AccessToken) {
    this._accessToken = accessToken;
  }

  get accessToken(): AccessToken {
    return this._accessToken;
  }
}
