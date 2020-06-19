import { NextFunction, Request, Response } from "express";
import { Operation } from "../../../../operation/operation";
import { BlApiRequest } from "../../../../request/bl-api-request";
import { SEResponseHandler } from "../../../../response/se.response.handler";
import { BlapiResponse } from "@wizardcoder/bl-model";

export class OrderPlaceOperation implements Operation {
  constructor(private _resHandler?: SEResponseHandler) {
    this._resHandler = this._resHandler
      ? this._resHandler
      : new SEResponseHandler();
  }

  public async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction
  ): Promise<boolean> {
    this._resHandler.sendResponse(res, new BlapiResponse([{ success: true }]));
    return true;
  }
}
