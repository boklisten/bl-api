import {BlApiRequest} from "../request/bl-api-request";
import {NextFunction, Request, Response} from "express";

export interface Operation {
	run(blApiRequest: BlApiRequest, req?: Request, res?: Response, next?: NextFunction): void
}