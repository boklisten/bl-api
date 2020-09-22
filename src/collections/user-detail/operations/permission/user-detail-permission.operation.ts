import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { UserSchema } from "../../../user/user.schema";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { User } from "../../../user/user";
import { BlapiResponse, BlError, UserDetail } from "@wizardcoder/bl-model";
import { userDetailSchema } from "../../user-detail.schema";
import { PermissionService } from "../../../../auth/permission/permission.service";
import { isNullOrUndefined } from "util";
import { SEResponseHandler } from "../../../../response/se.response.handler";

export class UserDetailPermissionOperation implements Operation {
  private _permissionService: PermissionService;

  constructor(
    private _userDetailStorage?: BlDocumentStorage<UserDetail>,
    private _userStorage?: BlDocumentStorage<User>,
    private _resHandler?: SEResponseHandler
  ) {
    this._userDetailStorage = _userDetailStorage
      ? _userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);

    this._userStorage = _userStorage
      ? _userStorage
      : new BlDocumentStorage("users", UserSchema);

    this._resHandler = _resHandler ? _resHandler : new SEResponseHandler();

    this._permissionService = new PermissionService();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction
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

    try {
      userDetail = await this._userDetailStorage.get(blApiRequest.documentId);
    } catch (e) {
      throw e;
    }

    let user: User;

    try {
      const users = await this._userStorage.aggregate([
        { $match: { blid: userDetail.blid } }
      ]);
      user = users[0];
    } catch (e) {
      throw e;
    }

    if (
      !this._permissionService.isAdmin(blApiRequest.user.permission) ||
      !this._permissionService.isPermissionOver(
        blApiRequest.user.permission,
        user.permission
      ) ||
      !this._permissionService.isPermissionOver(
        blApiRequest.user.permission,
        permissionChange
      )
    ) {
      throw new BlError("no access to change permission").code(904);
    }

    try {
      await this._userStorage.update(
        user["_id"],
        { permission: permissionChange },
        blApiRequest.user
      );
    } catch (e) {
      throw e;
    }

    this._resHandler.sendResponse(res, new BlapiResponse([{ success: true }]));

    return true;
  }
}
