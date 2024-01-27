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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction,
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const userDetail = await this._userDetailStorage.get(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      blApiRequest.documentId,
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const users = await this._userStorage.aggregate([
      { $match: { blid: userDetail.blid } },
    ]);
    const user = users[0];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._resHandler.sendResponse(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      res,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      new BlapiResponse([{ permission: user.permission }]),
    );
    return true;
  }
}
