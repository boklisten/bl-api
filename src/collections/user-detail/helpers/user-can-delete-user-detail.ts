import { AccessToken, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { PermissionService } from "../../../auth/permission/permission.service";
import { userDetailSchema } from "../user-detail.schema";
import { User } from "../../user/user";
import { UserSchema } from "../../user/user.schema";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";

export class UserCanDeleteUserDetail {
  private queryBuilder: SEDbQueryBuilder;
  private permissionService: PermissionService;
  constructor(
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
    private userStorage?: BlDocumentStorage<User>
  ) {
    this.userDetailStorage = this.userDetailStorage
      ? this.userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
    this.userStorage = this.userStorage
      ? this.userStorage
      : new BlDocumentStorage("users", UserSchema);
    this.queryBuilder = new SEDbQueryBuilder();
    this.permissionService = new PermissionService();
  }

  public async canDelete(
    userIdToDelete: string,
    accessToken: AccessToken
  ): Promise<boolean> {
    let userDetailToDelete;

    // eslint-disable-next-line no-useless-catch
    try {
      userDetailToDelete = await this.userDetailStorage.get(userIdToDelete);
    } catch (e) {
      throw e;
    }

    if (userDetailToDelete.id === accessToken.details) {
      return true;
    }

    if (!this.permissionService.isAdmin(accessToken.permission)) {
      return false;
    }

    const dbQuery = this.queryBuilder.getDbQuery(
      { username: userDetailToDelete.email },
      [{ fieldName: "username", type: "string" }]
    );

    let userToDelete;

    // eslint-disable-next-line no-useless-catch
    try {
      const users = await this.userStorage.getByQuery(dbQuery);
      userToDelete = users[0];
    } catch (e) {
      throw e;
    }

    if (
      !this.permissionService.isPermissionEqualOrOver(
        accessToken.permission,
        userToDelete.permission
      ) ||
      accessToken.permission === userToDelete.permission
    ) {
      return false;
    }

    return true;
  }
}
