import { AccessToken, UserDetail } from "@boklisten/bl-model";

import { PermissionService } from "../../../auth/permission/permission.service";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { User } from "../../user/user";
import { UserSchema } from "../../user/user.schema";
import { userDetailSchema } from "../user-detail.schema";

export class UserCanDeleteUserDetail {
  private queryBuilder: SEDbQueryBuilder;
  private permissionService: PermissionService;
  constructor(
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
    private userStorage?: BlDocumentStorage<User>,
  ) {
    this.userDetailStorage = this.userDetailStorage
      ? this.userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this.userStorage = this.userStorage
      ? this.userStorage
      : new BlDocumentStorage(BlCollectionName.Users, UserSchema);
    this.queryBuilder = new SEDbQueryBuilder();
    this.permissionService = new PermissionService();
  }

  public async canDelete(
    userIdToDelete: string,
    accessToken: AccessToken,
  ): Promise<boolean> {
    const userDetailToDelete = await this.userDetailStorage.get(userIdToDelete);

    if (userDetailToDelete.id === accessToken.details) {
      return true;
    }

    if (!this.permissionService.isAdmin(accessToken.permission)) {
      return false;
    }

    const dbQuery = this.queryBuilder.getDbQuery(
      { username: userDetailToDelete.email },
      [{ fieldName: "username", type: "string" }],
    );

    const users = await this.userStorage.getByQuery(dbQuery);
    const userToDelete = users[0];

    return !(
      !this.permissionService.isPermissionEqualOrOver(
        accessToken.permission,
        userToDelete.permission,
      ) || accessToken.permission === userToDelete.permission
    );
  }
}
