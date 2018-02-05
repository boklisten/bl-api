

import {Response} from 'express';
import {BlapiResponse} from "bl-model";
import {BlapiErrorResponse} from "bl-model";
import {BlError} from "bl-model";
import {BlErrorHandler} from "../bl-error/bl-error-handler";

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
	
	public sendAuthErrorResponse(res: Response, info: any) {
		const blapiErrorResponse = this.getBlapiErrorResponseByAuthError(info);
		this.setHeaders(res);
		res.status(blapiErrorResponse.httpStatus);
		res.send(blapiErrorResponse);
		res.end();
	}

	public sendErrorResponse(res: Response, blError: BlError) {
		
		let blapiErrorRes: BlapiErrorResponse = this.errorHandler.createBlapiErrorResponse(blError);
		
		res.status(blapiErrorRes.httpStatus);
		
		this.setHeaders(res);
		res.send(blapiErrorRes);
		
		
		res.end();
	}
	
	private setHeaders(res: Response) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
	}
	
	private getBlapiErrorResponseByAuthError(info: any): BlapiErrorResponse {
		if (info['name']) {
			switch (info['name']) {
				case 'TokenExpiredError':
					return new BlapiErrorResponse(401, 910, 'accessToken expired');
			}
		}
		return new BlapiErrorResponse(401, 905, 'token validation failed');
	}
}
