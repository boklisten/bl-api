import { BlapiResponse, BlError, UserDetail } from "@boklisten/bl-model";
import { NextFunction, Request, Response } from "express";

import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { UserDetailHelper } from "../helpers/user-detail.helper";
import { userDetailSchema } from "../user-detail.schema";

export class UserDetailValidOperation implements Operation {
  private _userDetailStorage: BlDocumentStorage<UserDetail>;
  private _userDetailHelper: UserDetailHelper;
  private _resHandler: SEResponseHandler;

  constructor(
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    resHandler?: SEResponseHandler,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userDetailHelper?: UserDetailHelper,
  ) {
    this._userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this._resHandler = resHandler ? resHandler : new SEResponseHandler();
    this._userDetailHelper = new UserDetailHelper();
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
    try {
      const userDetail = await this._userDetailStorage.get(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        blApiRequest.documentId,
      );

      const invalidUserDetailFields =
        this._userDetailHelper.getInvalidUserDetailFields(userDetail);

      if (invalidUserDetailFields.length <= 0) {
        this._resHandler.sendResponse(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          res,
          new BlapiResponse([{ valid: true }]),
        );
      } else {
        this._resHandler.sendResponse(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          res,
          new BlapiResponse([
            { valid: false, invalidFields: invalidUserDetailFields },
          ]),
        );
      }

      return true;
    } catch (err) {
      const responseError: BlError = new BlError(
        "userDetail could not be validated",
      );

      if (err instanceof BlError) {
        responseError.add(err);
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this._resHandler.sendErrorResponse(res, responseError);

      throw responseError;
    }
  }
}
