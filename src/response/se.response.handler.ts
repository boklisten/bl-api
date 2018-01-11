

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

	public sendErrorResponse(res: Response, blError: BlError) {
		let blapiErrorRes = this.errorHandler.createBlapiErrorResponse(blError);
		res.status(blapiErrorRes.code);
		this.setHeaders(res);
		res.send(blapiErrorRes.data);
		res.end();
	}
	
	private setHeaders(res: Response) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
	}
}
