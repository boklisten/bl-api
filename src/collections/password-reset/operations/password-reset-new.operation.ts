import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { PasswordReset } from "../password-reset";
import { passwordResetSchema } from "../password-reset.schema";
import { BlapiResponse, BlError } from "@boklisten/bl-model";
import { isNullOrUndefined } from "util";
import { LocalLoginHandler } from "../../../auth/local/local-login.handler";
import { SEResponseHandler } from "../../../response/se.response.handler";

export class PasswordResetNewOperation implements Operation {
  private _passwordResetStorage: BlDocumentStorage<PasswordReset>;
  private _localLoginHandler: LocalLoginHandler;
  private _resHandler: SEResponseHandler;

  constructor(
    passwordResetStorage?: BlDocumentStorage<PasswordReset>,
    localLoginHandler?: LocalLoginHandler,
    responseHandler?: SEResponseHandler
  ) {
    this._passwordResetStorage = passwordResetStorage
      ? passwordResetStorage
      : new BlDocumentStorage("passwordresets", passwordResetSchema);
    this._localLoginHandler = localLoginHandler
      ? localLoginHandler
      : new LocalLoginHandler();
    this._resHandler = responseHandler
      ? responseHandler
      : new SEResponseHandler();
  }

  run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (
        isNullOrUndefined(blApiRequest.data) ||
        isNullOrUndefined(blApiRequest.data["password"])
      ) {
        return reject(
          new BlError("blApiRequest.data.password is null or undefined")
        );
      }

      let newPassword = blApiRequest.data["password"];

      if (newPassword.length < 6) {
        return reject(
          new BlError("blApiRequest.data.password is under length of 6")
        );
      }

      this._passwordResetStorage
        .get(blApiRequest.documentId)
        .then((passwordReset: PasswordReset) => {
          this._localLoginHandler
            .setPassword(passwordReset.email, newPassword)
            .then(() => {
              this._resHandler.sendResponse(
                res,
                new BlapiResponse([{ success: true }])
              );

              resolve(true);
            })
            .catch((setPasswordError: BlError) => {
              reject(
                new BlError("could not update localLogin with password").add(
                  setPasswordError
                )
              );
            });
        })
        .catch((getPasswordResetError: BlError) => {
          reject(
            new BlError(`passwordReset "${blApiRequest.documentId}" not found`)
              .code(702)
              .add(getPasswordResetError)
          );
        });
    });
  }
}
