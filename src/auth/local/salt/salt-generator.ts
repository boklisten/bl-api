import { BlError } from "@boklisten/bl-model";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require("crypto");

export class SaltGenerator {
  public generate(): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(256, (error: Error | null, buffer: Buffer) => {
        if (error)
          reject(
            new BlError("could not create random bytes")
              .data(error)
              .className("SaltGenerator")
              .methodName("generate"),
          );

        resolve(buffer.toString("hex"));
      });
    });
  }
}
