import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { User } from "../../user/user";
import { UserSchema } from "../../user/user.schema";
import { LocalLogin } from "../../local-login/local-login";
import { localLoginSchema } from "../../local-login/local-login.schema";
import { AccessToken } from "@wizardcoder/bl-model";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";

export class UserDeleteAllInfo {
  private queryBuilder: SEDbQueryBuilder;
  constructor(
    private userStorage?: BlDocumentStorage<User>,
    private localLoginStorage?: BlDocumentStorage<LocalLogin>
  ) {
    this.userStorage = this.userStorage
      ? this.userStorage
      : new BlDocumentStorage("users", UserSchema);
    this.localLoginStorage = this.localLoginStorage
      ? this.localLoginStorage
      : new BlDocumentStorage("locallogins", localLoginSchema);
    this.queryBuilder = new SEDbQueryBuilder();
  }

  public async deleteAllInfo(
    userId: string,
    accessToken: AccessToken
  ): Promise<boolean> {
    const dbQuery = this.queryBuilder.getDbQuery({ userDetail: userId }, [
      { fieldName: "userDetail", type: "object-id" }
    ]);

    const users = await this.userStorage.getByQuery(dbQuery);
    const user = users[0];

    await this.userStorage.remove(user.id, {
      id: accessToken.details,
      permission: accessToken.permission
    });

    const localLoginDbQuery = this.queryBuilder.getDbQuery(
      { username: user.username },
      [{ fieldName: "username", type: "string" }]
    );

    const localLogins = await this.localLoginStorage.getByQuery(
      localLoginDbQuery
    );
    const localLogin = localLogins[0];

    await this.localLoginStorage.remove(localLogin.id, {
      id: accessToken.details,
      permission: accessToken.permission
    });

    return true;
  }
}
