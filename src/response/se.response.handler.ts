

import {Response} from 'express';
import {BlapiResponse} from "bl-model";
import {BlapiErrorResponse} from "bl-model";

export class SEResponseHandler {

	constructor() {

	}

	public sendResponse(res: Response, blapiRes: BlapiResponse) {
		res.status(200);
		this.setHeaders(res);
		res.send(blapiRes);
	}

	public sendErrorResponse(res: Response, blapiErrorRes: BlapiErrorResponse) {
		res.status(blapiErrorRes.code);
		this.setHeaders(res);
		res.end();
	}
	
	private setHeaders(res: Response) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
	}
}
