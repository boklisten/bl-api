import { BlError } from "@boklisten/bl-model";

import { RefreshTokenSecret } from "./refresh-token.secret";

export class RefreshTokenValidator {
  private jwt = require("jsonwebtoken");
  private refreshTokenSecret: RefreshTokenSecret;

  constructor() {
    this.refreshTokenSecret = new RefreshTokenSecret();
  }

  public validate(refreshToken: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!refreshToken || refreshToken.length <= 0)
        reject(new BlError("refreshToken is empty or undefined"));

      try {
        this.jwt.verify(
          refreshToken,
          this.refreshTokenSecret.get(),
          (error: unknown, payload: unknown) => {
            if (error)
              return reject(new BlError("could not validate token").code(909));
            resolve(payload);
          },
        );
      } catch (error) {
        reject(
          new BlError("could not validate token")
            .store("jwt error", error)
            .code(909),
        );
      }
    });
  }
}
