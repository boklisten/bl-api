

import {Response} from 'express';
import {BlapiResponse, BlapiErrorResponse, BlError} from "@wizardcoder/bl-model";
import {BlErrorHandler} from "../bl-error/bl-error-handler";
import {APP_CONFIG} from "../application-config";
import {logger} from "../logger/logger";
import chalk from "chalk";

export class SEResponseHandler {
	errorHandler: BlErrorHandler;

	constructor() {
		this.errorHandler = new BlErrorHandler();
	}

	public sendResponse(res: Response, blapiRes: BlapiResponse) {
		res.status(200);
		this.setHeaders(res);
		res.send(blapiRes);
	}
	
	public sendAuthTokens(res: Response, accessToken: string, refreshToken: string, referer?: string) {
		let redirectUrl = process.env.CLIENT_URI + 'auth/token';
		redirectUrl +=  ';accessToken=' + accessToken + ';refreshToken=' + refreshToken;

		res.redirect(redirectUrl);
	}

	public sendErrorResponse(res: Response, blError: BlError) {
		
		let blapiErrorRes: BlapiErrorResponse = this.errorHandler.createBlapiErrorResponse(blError);
		
		res.status(blapiErrorRes.httpStatus);
		
		this.setHeaders(res);
		res.send(blapiErrorRes);

		logger.verbose('<- ' + chalk.bold(`${blapiErrorRes.httpStatus} `) + blapiErrorRes.msg + '\n');

		res.end();
	}
	
	private setHeaders(res: Response) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
	}
	
	private getBlapiErrorResponseByAuthError(info: any): BlapiErrorResponse {
		if (info) {
			if (info['name']) {
				switch (info['name']) {
					case 'TokenExpiredError':
						return new BlapiErrorResponse(401, 910, 'accessToken expired');
				}
			}
			if (info.message) {
				if (info.message === 'No auth token') {
					return new BlapiErrorResponse(403, 911, 'no auth token');
				}
			}
		}
		return new BlapiErrorResponse(401, 905, 'token validation failed');
	}
}
