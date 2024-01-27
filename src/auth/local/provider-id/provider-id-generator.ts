import { BlError } from "@boklisten/bl-model";

import { SeCrypto } from "../../../crypto/se.crypto";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require("crypto");

export class ProviderIdGenerator {
  constructor(private seCrypto: SeCrypto) {}

  generate(username: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const blError = new BlError("")
        .className("ProviderIdGenerator")
        .methodName("generate");
      if (!username || username.length <= 0)
        reject(blError.msg("username is empty or undefined"));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      crypto.randomBytes(32, (error, buffer) => {
        if (error)
          reject(blError.msg("could not generate random bytes").data(error));

        this.seCrypto.hash(username, buffer.toString("hex")).then(
          (hashedMsg: string) => {
            resolve(hashedMsg);
          },
          (error: BlError) => {
            reject(
              error.add(
                blError.msg("could not hash the provided username and salt"),
              ),
            );
          },
        );
      });
    });
  }
}
