

import {Response} from 'express';
import {SEResponse} from "./se.response";
import {SEErrorResponse} from "./se.error.response";

export class SEResponseHandler {

	constructor() {

	}

	sendResponse(res: Response, seres: SEResponse): void {
		res.status(200);
		res.send(seres.docs);
	}

	sendErrorResponse(res: Response, seError: SEErrorResponse): void {
		console.log('sent error response', seError);
		res.status(seError.status);
		res.end();
	}
}
