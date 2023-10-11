import { isNullOrUndefined } from "util";

import { BlapiResponse, BlError, UserDetail } from "@boklisten/bl-model";
import { NextFunction, Request, Response } from "express";

import { PermissionService } from "../../../../auth/permission/permission.service";
import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../../bl-collection";
import { User } from "../../../user/user";
import { UserSchema } from "../../../user/user.schema";
import { userDetailSchema } from "../../user-detail.schema";

export class UserDetailPermissionOperation implements Operation {
  private _permissionService: PermissionService;

  constructor(
    private _userDetailStorage?: BlDocumentStorage<UserDetail>,
    private _userStorage?: BlDocumentStorage<User>,
    private _resHandler?: SEResponseHandler,
  ) {
    this._userDetailStorage = _userDetailStorage
      ? _userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);

    this._userStorage = _userStorage
      ? _userStorage
      : new BlDocumentStorage(BlCollectionName.Users, UserSchema);

    this._resHandler = _resHandler ? _resHandler : new SEResponseHandler();

    this._permissionService = new PermissionService();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction,
  ): Promise<boolean> {
    if (
      isNullOrUndefined(blApiRequest.data) ||
      isNullOrUndefined(blApiRequest.data["permission"]) ||
      !this._permissionService.isPermission(blApiRequest.data["permission"])
    ) {
      throw new BlError("permission is not valid or not provided").code(701);
    }

    const permissionChange = blApiRequest.data["permission"];

    if (blApiRequest.documentId == blApiRequest.user.id) {
      throw new BlError("user can not change own permission");
    }

    let userDetail: UserDetail;

    // eslint-disable-next-line no-useless-catch
    try {
      userDetail = await this._userDetailStorage.get(blApiRequest.documentId);
    } catch (e) {
      throw e;
    }

    let user: User;

    // eslint-disable-next-line no-useless-catch
    try {
      const users = await this._userStorage.aggregate([
        { $match: { blid: userDetail.blid } },
      ]);
      user = users[0];
    } catch (e) {
      throw e;
    }

    if (
      !this._permissionService.isAdmin(blApiRequest.user.permission) ||
      !this._permissionService.isPermissionOver(
        blApiRequest.user.permission,
        user.permission,
      ) ||
      !this._permissionService.isPermissionOver(
        blApiRequest.user.permission,
        permissionChange,
      )
    ) {
      throw new BlError("no access to change permission").code(904);
    }

    // eslint-disable-next-line no-useless-catch
    try {
      await this._userStorage.update(
        user["_id"],
        { permission: permissionChange },
        blApiRequest.user,
      );
    } catch (e) {
      throw e;
    }

    this._resHandler.sendResponse(res, new BlapiResponse([{ success: true }]));

    return true;
  }
}
