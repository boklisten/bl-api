import { BlApiRequest } from "../../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { UserSchema } from "../../../user/user.schema";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { User } from "../../../user/user";
import { BlapiResponse, BlError, UserDetail } from "@boklisten/bl-model";
import { userDetailSchema } from "../../user-detail.schema";
import { PermissionService } from "../../../../auth/permission/permission.service";
import { isNullOrUndefined } from "util";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { Operation } from "../../../../operation/operation";

export class UserDetailReadPermissionOperation implements Operation {
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
    let userDetail;

    try {
      userDetail = await this._userDetailStorage.get(blApiRequest.documentId);
    } catch (e) {
      throw e;
    }

    let user: User;

    try {
      const users = await this._userStorage.aggregate([
        { $match: { blid: userDetail.blid } },
      ]);
      user = users[0];
    } catch (e) {
      throw e;
    }

    this._resHandler.sendResponse(
      res,
      new BlapiResponse([{ permission: user.permission }])
    );
    return true;
  }
}
