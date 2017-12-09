

import {BlError} from "./bl-error";
import {BlapiErrorResponse} from "bl-model";

export class BlErrorHandler {
	
	public createBlapiErrorResponse(blError: BlError): BlapiErrorResponse {
		blError.printStack();
		return new BlapiErrorResponse(this.extractCode(blError));
	}
	
	private extractCode(blError: BlError): number {
		if (!blError.getCode() || blError.getCode() === 0) return 500;
		return blError.getCode();
	}
	
	
}