import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlapiResponse, BlError, UserDetail } from "@boklisten/bl-model";
import { userDetailSchema } from "../user-detail.schema";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { isNullOrUndefined } from "util";
import { UserDetailHelper } from "../helpers/user-detail.helper";

export class UserDetailValidOperation implements Operation {
  private _userDetailStorage: BlDocumentStorage<UserDetail>;
  private _userDetailHelper: UserDetailHelper;
  private _resHandler: SEResponseHandler;

  constructor(
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    resHandler?: SEResponseHandler,
    userDetailHelper?: UserDetailHelper
  ) {
    this._userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
    this._resHandler = resHandler ? resHandler : new SEResponseHandler();
    this._userDetailHelper = new UserDetailHelper();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction
  ): Promise<boolean> {
    try {
      let userDetail = await this._userDetailStorage.get(
        blApiRequest.documentId
      );

      let invalidUserDetailFields =
        this._userDetailHelper.getInvalidUserDetailFields(userDetail);

      if (invalidUserDetailFields.length <= 0) {
        this._resHandler.sendResponse(
          res,
          new BlapiResponse([{ valid: true }])
        );
      } else {
        this._resHandler.sendResponse(
          res,
          new BlapiResponse([
            { valid: false, invalidFields: invalidUserDetailFields },
          ])
        );
      }

      return true;
    } catch (err) {
      let responseError: BlError = new BlError(
        "userDetail could not be validated"
      );

      if (err instanceof BlError) {
        responseError.add(err);
      }

      this._resHandler.sendErrorResponse(res, responseError);

      throw responseError;
    }
  }
}
