import { BlError } from "@boklisten/bl-model";
import isEmail from "validator/lib/isEmail";

import { LocalLogin } from "../../../collections/local-login/local-login";
import { SeCrypto } from "../../../crypto/se.crypto";
import { HashedPasswordGenerator } from "../password/hashed-password-generator";
import { ProviderIdGenerator } from "../provider-id/provider-id-generator";
import { SaltGenerator } from "../salt/salt-generator";

export class LocalLoginCreator {
  private _hashedPasswordGenerator: HashedPasswordGenerator;
  private _providerIdGenerator: ProviderIdGenerator;

  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private hashedPasswordGenerator?: HashedPasswordGenerator,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private providerIdGenerator?: ProviderIdGenerator,
  ) {
    this._hashedPasswordGenerator = hashedPasswordGenerator
      ? hashedPasswordGenerator
      : new HashedPasswordGenerator(new SaltGenerator(), new SeCrypto());
    this._providerIdGenerator = providerIdGenerator
      ? providerIdGenerator
      : new ProviderIdGenerator(new SeCrypto());
  }

  public create(username: string, password: string): Promise<LocalLogin> {
    return new Promise((resolve, reject) => {
      const blError = new BlError("")
        .className("LocalLoginCreator")
        .methodName("create");
      if (!username || !isEmail(username))
        return reject(
          blError
            .msg('username "' + username + '" is undefined or not an Email')
            .code(103),
        );
      if (!password || password.length < 6)
        return reject(blError.msg("password is to short or empty").code(103));

      this._hashedPasswordGenerator.generate(password).then(
        (hashedPasswordAndSalt: { hashedPassword: string; salt: string }) => {
          this._providerIdGenerator.generate(username).then(
            (providerId: string) => {
              const newLocalLogin = new LocalLogin();
              newLocalLogin.username = username;
              newLocalLogin.hashedPassword =
                hashedPasswordAndSalt.hashedPassword;
              newLocalLogin.salt = hashedPasswordAndSalt.salt;
              newLocalLogin.provider = "local";
              newLocalLogin.providerId = providerId;

              resolve(newLocalLogin);
            },
            (providerIdGeneratorError: BlError) => {
              reject(
                blError
                  .msg("could not create providerId")
                  .add(providerIdGeneratorError),
              );
            },
          );
        },
        (hashedPasswordGeneratorError: BlError) => {
          reject(
            blError
              .msg("could not create hashedPassword and salt")
              .add(hashedPasswordGeneratorError),
          );
        },
      );
    });
  }
}
