import {
  BlError,
  PasswordResetRequest,
  PendingPasswordReset,
} from "@boklisten/bl-model";

import { UserHandler } from "../../../auth/user/user.handler";
import { SeCrypto } from "../../../crypto/se.crypto";
import { Hook } from "../../../hook/hook";
import { Messenger } from "../../../messenger/messenger";

export class PendingPasswordResetPostHook extends Hook {
  constructor(
    private readonly userHandler?: UserHandler,
    private readonly seCrypto?: SeCrypto,
    private readonly messenger?: Messenger,
  ) {
    super();
    this.userHandler ??= new UserHandler();
    this.seCrypto ??= new SeCrypto();
    this.messenger ??= new Messenger();
  }

  override async before(
    passwordResetRequest: unknown,
  ): Promise<PendingPasswordReset> {
    validatePasswordResetRequest(passwordResetRequest);

    const user = await this.userHandler
      .getByUsername(passwordResetRequest.email)
      .catch((getUserError: BlError) => {
        throw new BlError(`username "${passwordResetRequest.email}" not found`)
          .code(10702)
          .add(getUserError);
      });

    if (!user.active) {
      throw new BlError("user.active is false").code(10703);
    }

    const id = this.seCrypto.random();
    const token = this.seCrypto.random();
    const salt = this.seCrypto.random();
    const tokenHash = await this.seCrypto.hash(token, salt);

    // We should really wait to send the email until the password reset has been successfully written to the
    // database, but it would be poor security to save the unhashed token in the database, and we have no other way
    // of passing information from before to after, so this is the lesser evil.
    await this.messenger
      .passwordReset(user.id, passwordResetRequest.email, id, token)
      .catch(() => {
        throw new BlError(
          `Unable to send password reset email to ${passwordResetRequest.email}`,
        ).code(10200);
      });

    return {
      id,
      email: passwordResetRequest.email,
      tokenHash,
      salt,
    };
  }

  // Don't return the stored secrets!
  override async after(): Promise<never[]> {
    return [];
  }
}

function validatePasswordResetRequest(
  candidate: unknown,
): asserts candidate is PasswordResetRequest {
  if (!candidate || !candidate["email"]) {
    throw new BlError(
      "passwordResetRequest.email is null, empty or undefined",
    ).code(701);
  }

  if (typeof candidate["email"] !== "string") {
    throw new BlError("passwordResetRequest.email is not a string").code(701);
  }
}
