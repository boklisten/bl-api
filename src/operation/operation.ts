import { BlApiRequest } from "../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { BlapiResponse } from "@boklisten/bl-model";

export interface Operation {
  run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction,
  ): Promise<boolean | BlapiResponse>;
}
