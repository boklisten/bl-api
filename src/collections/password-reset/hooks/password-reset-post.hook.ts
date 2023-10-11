import { AccessToken, BlError, UserDetail } from "@boklisten/bl-model";
import isEmail from "validator/lib/isEmail";

import { UserHandler } from "../../../auth/user/user.handler";
import { SeCrypto } from "../../../crypto/se.crypto";
import { Hook } from "../../../hook/hook";
import { Messenger } from "../../../messenger/messenger";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { User } from "../../user/user";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { PasswordReset } from "../password-reset";

export class PasswordResetPostHook extends Hook {
  private _userDetailStorage: BlDocumentStorage<UserDetail>;
  private _userHandler: UserHandler;
  private _seCrypto: SeCrypto;
  private _messenger: Messenger;

  constructor(
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    userHandler?: UserHandler,
    seCrypto?: SeCrypto,
    messenger?: Messenger,
  ) {
    super();
    this._userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this._userHandler = userHandler ?? new UserHandler();
    this._seCrypto = seCrypto ?? new SeCrypto();
    this._messenger = messenger ?? new Messenger();
  }

  override before(
    passwordReset: PasswordReset,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessToken?: AccessToken,
  ): Promise<PasswordReset> {
    if (!passwordReset) {
      return Promise.reject(new BlError("passwordReset is empty or undefined"));
    }

    if (!passwordReset.email || !isEmail(passwordReset.email)) {
      return Promise.reject(
        new BlError(`passwordReset.email is not a valid email`),
      );
    }

    return new Promise((resolve, reject) => {
      this._userHandler
        .getByUsername(passwordReset.email)
        .then((user: User) => {
          if (!user.active) {
            reject(new BlError("user.active is false").code(703));
          }

          passwordReset.userDetail = user.userDetail;
          passwordReset.token = this._seCrypto.random();

          resolve(passwordReset);
        })
        .catch((getUserError: BlError) => {
          reject(
            new BlError(`user "${passwordReset.email}" not found`).add(
              getUserError,
            ),
          );
        });
    });
  }

  override after(
    passwordResets: PasswordReset[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessToken?: AccessToken,
  ): Promise<PasswordReset[]> {
    return new Promise((resolve, reject) => {
      const passwordReset = passwordResets[0];

      this._userDetailStorage
        .get(passwordReset.userDetail)
        .then((userDetail: UserDetail) => {
          this._messenger.passwordReset(userDetail, passwordReset.id);

          return resolve([passwordReset]);
        })
        .catch((getUserDetailError: BlError) => {
          reject(
            new BlError(
              `userDetail "${passwordReset.userDetail}" not found`,
            ).add(getUserDetailError),
          );
        });
    });
  }
}
