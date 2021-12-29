import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { EmailValidation } from "../email-validation";
import { emailValidationSchema } from "../email-validation.schema";
import { BlapiResponse, BlError, UserDetail } from "@boklisten/bl-model";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { isNullOrUndefined } from "util";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { SystemUser } from "../../../auth/permission/permission.service";

export class EmailValidationConfirmOperation implements Operation {
  private _emailValidationStorage: BlDocumentStorage<EmailValidation>;
  private _resHandler: SEResponseHandler;
  private _userDetailStorage: BlDocumentStorage<UserDetail>;

  constructor(
    emailValidationStorage?: BlDocumentStorage<EmailValidation>,
    resHandler?: SEResponseHandler,
    userDetailStorage?: BlDocumentStorage<UserDetail>
  ) {
    this._emailValidationStorage = emailValidationStorage
      ? emailValidationStorage
      : new BlDocumentStorage("email_validations", emailValidationSchema);
    this._resHandler = resHandler ? resHandler : new SEResponseHandler();
    this._userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
  }

  run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (isNullOrUndefined(blApiRequest.documentId)) {
        return reject(new BlError("no documentId provided"));
      }

      this._emailValidationStorage
        .get(blApiRequest.documentId)
        .then((emailValidation: EmailValidation) => {
          this._userDetailStorage
            .update(
              emailValidation.userDetail,
              { emailConfirmed: true },
              new SystemUser()
            )
            .then(() => {
              this._resHandler.sendResponse(
                res,
                new BlapiResponse([{ confirmed: true }])
              );
              resolve(true);
            })
            .catch((updateUserDetailError: BlError) => {
              const err = new BlError(
                `could not update userDetail "${emailValidation.id}" with emailConfirmed true`
              ).add(updateUserDetailError);

              this._resHandler.sendErrorResponse(res, err);
              reject(err);
            });
        })
        .catch((getEmailValidationError: BlError) => {
          this._resHandler.sendErrorResponse(res, getEmailValidationError);
          reject(
            new BlError(
              `emailValidation "${blApiRequest.documentId}" not found`
            )
              .code(702)
              .add(getEmailValidationError)
          );
        });
    });
  }
}
