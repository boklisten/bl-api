import { BlapiResponse, UserDetail } from "@boklisten/bl-model";
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

export class UserDetailReadPermissionOperation implements Operation {
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

    new PermissionService();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction,
  ): Promise<boolean> {
    const userDetail = await this._userDetailStorage.get(
      blApiRequest.documentId,
    );

    const users = await this._userStorage.aggregate([
      { $match: { blid: userDetail.blid } },
    ]);
    const user = users[0];

    this._resHandler.sendResponse(
      res,
      new BlapiResponse([{ permission: user.permission }]),
    );
    return true;
  }
}
