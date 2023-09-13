import { BlError, BlapiErrorResponse } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../storage/blDocumentStorage";
import { BlErrorLog } from "../collections/bl-error-log/bl-error-log";
import { blErrorLogSchema } from "../collections/bl-error-log/bl-error-log.schema";
import { logger } from "../logger/logger";
import { BlCollectionName } from "../collections/bl-collection";

export class BlErrorHandler {
  private _errorLogStorage: BlDocumentStorage<BlErrorLog>;

  constructor(errorLogStorage?: BlDocumentStorage<BlErrorLog>) {
    this._errorLogStorage = errorLogStorage
      ? errorLogStorage
      : new BlDocumentStorage<BlErrorLog>(
          BlCollectionName.BlErrorLogs,
          blErrorLogSchema
        );
  }

  public createBlapiErrorResponse(err): BlapiErrorResponse {
    let blError = err;

    if (!(err instanceof BlError)) {
      blError = new BlError("unknown error").store("error", err);
    }
    this.printErrorStack(blError);
    this.storeError(blError);

    const blErrorResponse = this.getErrorResponse(blError);

    return new BlapiErrorResponse(
      blErrorResponse.httpStatus,
      blErrorResponse.code,
      blErrorResponse.msg
    );
  }

  public storeError(blError: BlError) {
    if (blError && blError.getCode()) {
      if (blError.getCode() === 909 || blError.getCode() === 910) {
        // if it is a accessToken or RefreshToken error, don't store return;
        return;
      }
    }

    this._errorLogStorage
      .add(new BlErrorLog(blError), { id: "SYSTEM", permission: "super" })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .then(() => {})
      .catch((blErrorAddError) => {
        logger.warn(
          "blErrorHandler: there was a error saving the BlErrorLog: " +
            blErrorAddError
        );
      });
  }

  private printErrorStack(blError: BlError) {
    this.printBlError(blError);
  }

  private printBlError(blError: BlError) {
    if (!(blError instanceof BlError)) {
      logger.warn(`! unknown error: ${blError}`);
      return;
    }

    if (blError.errorStack && blError.errorStack.length > 0) {
      for (const err of blError.errorStack) {
        this.printBlError(err);
      }
    }

    logger.verbose(`! (${blError.getCode()}): ${blError.getMsg()}`);

    if (blError.getStore() && blError.getStore().length > 0) {
      for (const storeData of blError.getStore()) {
        logger.verbose(
          `! (${blError.getCode()}) ${JSON.stringify(storeData.value)}`
        );
      }
    }
  }

  private getErrorResponse(blError: BlError): BlapiErrorResponse {
    const blapiErrorResponse: BlapiErrorResponse = {
      httpStatus: 500,
      code: blError.getCode(),
      msg: "server error",
      data: null,
    };

    if (!blError.getCode() || blError.getCode() === 0)
      return blapiErrorResponse;
    else if (blError.getCode() >= 200 && blError.getCode() <= 299)
      return this.serverErrorResponse(blError.getCode());
    else if (blError.getCode() >= 700 && blError.getCode() <= 799)
      return this.documentErrorResponse(blError.getCode());
    else if (blError.getCode() >= 800 && blError.getCode() <= 899)
      return this.requestErrorResponse(blError.getCode());
    else if (blError.getCode() >= 900 && blError.getCode() <= 999)
      return this.authErrorResponse(blError.getCode());
    else return blapiErrorResponse;
  }

  private serverErrorResponse(code: number): BlapiErrorResponse {
    const blapiErrorResponse: BlapiErrorResponse = {
      httpStatus: 500,
      code: code,
      msg: "server error",
      data: null,
    };

    switch (code) {
      case 200:
        blapiErrorResponse.msg = "server error";
        break;
    }

    return blapiErrorResponse;
  }

  private requestErrorResponse(code: number): BlapiErrorResponse {
    const blapiErrorResponse: BlapiErrorResponse = {
      httpStatus: 500,
      code: code,
      msg: "server error",
      data: null,
    };

    switch (code) {
      case 800:
        blapiErrorResponse.msg = "server error";
        break;
      case 801:
        blapiErrorResponse.msg =
          "En eller flere av bøkene du prøver å dele ut er allerede aktiv på en annen kunde. Prøv å dele ut én og én bok for å finne ut hvilke bøker dette gjelder.";
        blapiErrorResponse.httpStatus = 409;
        break;
      case 802:
        blapiErrorResponse.msg =
          "Ordren inneholder bøker som er låst til en UserMatch; kunden må overlevere de låste bøkene til en annen elev";
        blapiErrorResponse.httpStatus = 409;
        break;
      case 803:
        blapiErrorResponse.msg = "invalid blid";
        blapiErrorResponse.httpStatus = 400;
        break;
      case 804:
        blapiErrorResponse.msg =
          "Boken du har scannet er ikke aktiv. Ta kontakt med stand for hjelp";
        blapiErrorResponse.httpStatus = 404;
        break;
      case 805:
        blapiErrorResponse.msg = "Boken du har scannet er ikke i din bokliste";
        blapiErrorResponse.httpStatus = 409;
        break;
      case 806:
        blapiErrorResponse.msg = "Du har allerede mottatt denne boka";
        blapiErrorResponse.httpStatus = 409;
        break;
      case 807:
        blapiErrorResponse.msg =
          "Ordren inneholder bøker som er låst til en UserMatch; kunden må motta de låste bøkene fra en annen elev";
        blapiErrorResponse.httpStatus = 409;
        break;
      case 808:
        blapiErrorResponse.msg = "Bad request format";
        blapiErrorResponse.httpStatus = 400;
        break;
    }

    return blapiErrorResponse;
  }

  private documentErrorResponse(code: number): BlapiErrorResponse {
    const blapiErrorResponse: BlapiErrorResponse = {
      httpStatus: 400,
      code: code,
      msg: "bad format",
      data: null,
    };

    switch (code) {
      case 701:
        blapiErrorResponse.httpStatus = 400;
        blapiErrorResponse.msg = "bad format";
        break;
      case 702:
        blapiErrorResponse.httpStatus = 404;
        blapiErrorResponse.msg = "not found";
        break;
    }
    return blapiErrorResponse;
  }

  private authErrorResponse(code: number): BlapiErrorResponse {
    const blapiErrorResponse: BlapiErrorResponse = {
      httpStatus: 401,
      code: code,
      msg: "authentication failure",
      data: null,
    };

    switch (code) {
      case 901:
        blapiErrorResponse.msg = "password is wrong";
        break;
      case 902:
        blapiErrorResponse.msg = "user is not valid";
        break;
      case 903:
        blapiErrorResponse.httpStatus = 400;
        blapiErrorResponse.msg = "username already exists";
        break;
      case 904:
        blapiErrorResponse.httpStatus = 403;
        blapiErrorResponse.msg = "forbidden";
        break;
      case 905:
        blapiErrorResponse.msg = "invalid token";
        break;
      case 906:
        blapiErrorResponse.msg = "token creation failed";
        break;
      case 907:
        blapiErrorResponse.msg = "user creation failed";
        blapiErrorResponse.httpStatus = 400;
        break;
      case 908:
        blapiErrorResponse.msg = "username or password is wrong";
        break;
      case 909:
        blapiErrorResponse.msg = "refreshToken not valid";
        break;
      case 910:
        blapiErrorResponse.msg =
          "bruker kan ikke endre egen e-post-bekreftet-status";
        break;
    }

    return blapiErrorResponse;
  }
}
