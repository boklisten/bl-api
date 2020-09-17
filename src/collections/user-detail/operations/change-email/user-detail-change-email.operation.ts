import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { User } from "../../../user/user";
import { BlapiResponse, BlError, UserDetail } from "@wizardcoder/bl-model";
import { userDetailSchema } from "../../user-detail.schema";
import { PermissionService } from "../../../../auth/permission/permission.service";
import { isNullOrUndefined } from "util";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { UserSchema } from "../../../user/user.schema";
import { LocalLogin } from "../../../local-login/local-login";
import { localLoginSchema } from "../../../local-login/local-login.schema";
import { UserHandler } from "../../../../auth/user/user.handler";
const emailValidator = require("validator");

export class UserDetailChangeEmailOperation implements Operation {
  private _permissionService: PermissionService;

  constructor(
    private _userDetailStorage?: BlDocumentStorage<UserDetail>,
    private _userStorage?: BlDocumentStorage<User>,
    private _localLoginStorage?: BlDocumentStorage<LocalLogin>,
    private _userHandler?: UserHandler,
    private _resHandler?: SEResponseHandler
  ) {
    this._userDetailStorage = _userDetailStorage
      ? _userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
    this._userStorage = _userStorage
      ? _userStorage
      : new BlDocumentStorage("users", UserSchema);
    this._localLoginStorage = _localLoginStorage
      ? _localLoginStorage
      : new BlDocumentStorage("locallogins", localLoginSchema);
    this._userHandler = _userHandler ? _userHandler : new UserHandler();
    this._resHandler = _resHandler ? _resHandler : new SEResponseHandler();
    this._permissionService = new PermissionService();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction
  ): Promise<boolean> {
    let userDetail: UserDetail;

    const emailChange = blApiRequest.data["email"];

    if (
      isNullOrUndefined(emailChange) ||
      !emailValidator.isEmail(emailChange)
    ) {
      throw new BlError("email is not valid").code(701);
    }

    try {
      userDetail = await this._userDetailStorage.get(blApiRequest.documentId);
    } catch (e) {
      throw e;
    }

    let user: User;

    try {
      const users = await this._userStorage.aggregate([
        { $match: { username: userDetail.email, blid: userDetail.blid } }
      ]);
      user = users[0];
    } catch (e) {
      throw e;
    }

    if (
      !this._permissionService.isPermissionOver(
        blApiRequest.user.permission,
        user.permission
      )
    ) {
      throw new BlError("no access to change email");
    }

    let localLogin;

    try {
      const localLogins = await this._localLoginStorage.aggregate([
        { $match: { username: userDetail.email } }
      ]);
      localLogin = localLogins[0];
    } catch (e) {
      throw e;
    }

    let alreadyAddedUser;
    try {
      alreadyAddedUser = await this._userHandler.getByUsername(emailChange);
    } catch (e) {}

    if (!isNullOrUndefined(alreadyAddedUser)) {
      throw new BlError("email is already present in database").code(701);
    }

    try {
      await this._userDetailStorage.update(
        userDetail["_id"],
        { email: emailChange },
        blApiRequest.user
      );
      await this._userStorage.update(
        user["_id"],
        { username: emailChange },
        blApiRequest.user
      );
      await this._localLoginStorage.update(
        localLogin["_id"],
        { username: emailChange },
        blApiRequest.user
      );
    } catch (e) {
      throw e;
    }

    this._resHandler.sendResponse(res, new BlapiResponse([{ success: true }]));
    return true;
  }
}
