import { BlError } from "@boklisten/bl-model";

import { SeCrypto } from "../../../crypto/se.crypto";
import { SaltGenerator } from "../salt/salt-generator";

export class HashedPasswordGenerator {
  constructor(
    private saltGenerator: SaltGenerator,
    private seCrypto: SeCrypto,
  ) {}

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public generate(password): Promise<{ hashedPassword: string; salt: string }> {
    return new Promise((resolve, reject) => {
      const blError = new BlError("")
        .className("HashedPasswordGenerator")
        .methodName("generate");
      if (!password || password.length < 6)
        reject(blError.msg("password is empty or to short"));

      this.saltGenerator.generate().then(
        (generatedSalt: string) => {
          this.seCrypto.hash(password, generatedSalt).then(
            (hash: string) => {
              resolve({ hashedPassword: hash, salt: generatedSalt });
            },
            (error: BlError) => {
              reject(
                error.add(
                  blError
                    .msg("could not hash the provided password and salt")
                    .store("salt", generatedSalt),
                ),
              );
            },
          );
        },
        (error: BlError) => {
          reject(error.add(blError.msg("could not generate salt")));
        },
      );
    });
  }
}
