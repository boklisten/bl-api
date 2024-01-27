import {
  BlapiResponse,
  BlapiErrorResponse,
  BlError,
} from "@boklisten/bl-model";
import { Response } from "express";

import { BlErrorHandler } from "../bl-error/bl-error-handler";
import { logger } from "../logger/logger";

export class SEResponseHandler {
  errorHandler: BlErrorHandler;

  constructor() {
    this.errorHandler = new BlErrorHandler();
  }

  public sendResponse(res: Response, blapiRes: BlapiResponse) {
    logger.silly(`<- 200`);
    res.status(200);
    this.setHeaders(res);
    res.send(blapiRes);
  }

  public sendAuthTokens(
    res: Response,
    accessToken: string,
    refreshToken: string,
    referer?: string,
  ) {
    const redirectUrl = `${
      referer ?? process.env["CLIENT_URI"]
    }auth/token;accessToken=${accessToken};refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
  }

  public sendErrorResponse(res: Response, blError: BlError) {
    const blapiErrorRes: BlapiErrorResponse =
      this.errorHandler.createBlapiErrorResponse(blError);

    res.status(blapiErrorRes.httpStatus);

    this.setHeaders(res);

    if (blapiErrorRes.httpStatus === 200) {
      logger.verbose(`<- ${blapiErrorRes.httpStatus} ${blapiErrorRes.msg}`);
      this.sendResponse(res, new BlapiResponse(blapiErrorRes.data));
      return;
    }

    res.send(blapiErrorRes);
    logger.verbose(`<- ${blapiErrorRes.httpStatus} ${blapiErrorRes.msg}`);

    res.end();
  }

  private setHeaders(res: Response) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
  }
}
