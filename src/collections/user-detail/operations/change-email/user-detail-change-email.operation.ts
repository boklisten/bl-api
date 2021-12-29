import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { User } from "../../../user/user";
import { BlapiResponse, BlError, UserDetail } from "@boklisten/bl-model";
import { userDetailSchema } from "../../user-detail.schema";
import { PermissionService } from "../../../../auth/permission/permission.service";
import { isNullOrUndefined } from "util";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { UserSchema } from "../../../user/user.schema";
import { LocalLogin } from "../../../local-login/local-login";
import { localLoginSchema } from "../../../local-login/local-login.schema";
import { UserHandler } from "../../../../auth/user/user.handler";
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction
  ): Promise<boolean> {
    let userDetail: UserDetail;
    let user: User;
    let localLogin;

    const emailChange = blApiRequest.data["email"];

    // eslint-disable-next-line no-useless-catch
    try {
      this.validateEmail(emailChange);
      userDetail = await this._userDetailStorage.get(blApiRequest.documentId);
      user = await this.getUser(userDetail.email, userDetail.blid);
      localLogin = await this.getLocalLogin(userDetail.email);
      this.validatePermission(blApiRequest.user.permission, user.permission);
      await this.checkIfAlreadyAdded(emailChange);
    } catch (e) {
      throw e;
    }

    // eslint-disable-next-line no-useless-catch
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

  private async checkIfAlreadyAdded(email: string): Promise<boolean> {
    let alreadyAddedUser;

    try {
      alreadyAddedUser = await this._userHandler.getByUsername(email);
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (!isNullOrUndefined(alreadyAddedUser)) {
      throw new BlError("email is already present in database").code(701);
    }

    return false;
  }

  private validatePermission(
    userPermission,
    permissionToEmailChangeUser
  ): boolean {
    if (
      !this._permissionService.isPermissionOver(
        userPermission,
        permissionToEmailChangeUser
      )
    ) {
      throw new BlError("no access to change email");
    }
    return true;
  }

  private async getUser(email: string, blid: string): Promise<User> {
    let user;
    // eslint-disable-next-line no-useless-catch
    try {
      const users = await this._userStorage.aggregate([
        { $match: { username: email, blid: blid } },
      ]);
      user = users[0];
    } catch (e) {
      throw e;
    }
    return user;
  }

  private async getLocalLogin(username: string): Promise<LocalLogin> {
    let localLogin: LocalLogin | PromiseLike<LocalLogin>;
    // eslint-disable-next-line no-useless-catch
    try {
      const localLogins = await this._localLoginStorage.aggregate([
        { $match: { username: username } },
      ]);
      localLogin = localLogins[0];
    } catch (e) {
      throw e;
    }
    return localLogin;
  }

  private validateEmail(email: string) {
    if (isNullOrUndefined(email) || !emailValidator.isEmail(email)) {
      throw new BlError("email is not valid").code(701);
    }
  }
}
