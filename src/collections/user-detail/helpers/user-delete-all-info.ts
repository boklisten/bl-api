import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { User } from "../../user/user";
import { UserSchema } from "../../user/user.schema";
import { LocalLogin } from "../../local-login/local-login";
import { localLoginSchema } from "../../local-login/local-login.schema";
import { AccessToken, BlError } from "@boklisten/bl-model";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { BlCollectionName } from "../../bl-collection";

export class UserDeleteAllInfo {
  private queryBuilder: SEDbQueryBuilder;
  constructor(
    private userStorage?: BlDocumentStorage<User>,
    private localLoginStorage?: BlDocumentStorage<LocalLogin>,
  ) {
    this.userStorage = this.userStorage
      ? this.userStorage
      : new BlDocumentStorage(BlCollectionName.Users, UserSchema);
    this.localLoginStorage = this.localLoginStorage
      ? this.localLoginStorage
      : new BlDocumentStorage(BlCollectionName.LocalLogins, localLoginSchema);
    this.queryBuilder = new SEDbQueryBuilder();
  }

  public async deleteAllInfo(
    userDetailId: string,
    accessToken: AccessToken,
  ): Promise<boolean> {
    const user = await this.removeUser(userDetailId, accessToken);

    await this.removeLocalLogin(user.username, accessToken);

    return true;
  }

  private async removeUser(
    userDetailId: string,
    accessToken: AccessToken,
  ): Promise<User> {
    const dbQuery = this.queryBuilder.getDbQuery({ userDetail: userDetailId }, [
      { fieldName: "userDetail", type: "object-id" },
    ]);

    const users = await this.userStorage.getByQuery(dbQuery);

    if (users.length > 1) {
      throw new BlError(
        `could not remove user "${userDetailId}": multiple users was found with same username`,
      );
    }

    const user = users[0];

    await this.userStorage.remove(user.id, {
      id: accessToken.details,
      permission: accessToken.permission,
    });

    return user;
  }

  private async removeLocalLogin(
    username: string,
    accessToken: AccessToken,
  ): Promise<boolean> {
    const localLoginDbQuery = this.queryBuilder.getDbQuery(
      { username: username },
      [{ fieldName: "username", type: "string" }],
    );

    const localLogins =
      await this.localLoginStorage.getByQuery(localLoginDbQuery);
    const localLogin = localLogins[0];

    await this.localLoginStorage.remove(localLogin.id, {
      id: accessToken.details,
      permission: accessToken.permission,
    });

    return true;
  }
}
