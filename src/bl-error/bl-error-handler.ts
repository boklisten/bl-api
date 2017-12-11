

import {BlError} from "./bl-error";
import {BlapiErrorResponse} from "bl-model";
import {SEDocument} from "../db/model/se.document";

export type BlErrorResponse = {
	httpStatus: number;
	code: number;
	message: string;
}

export class BlErrorHandler {
	
	public createBlapiErrorResponse(blError: BlError): BlapiErrorResponse {
		blError.printStack();
		let blErrorResponse = this.getErrorResponse(blError);
		return new BlapiErrorResponse(blErrorResponse.httpStatus, blErrorResponse.message, new SEDocument('blError', blErrorResponse));
	}
	
	private getErrorResponse(blError: BlError): BlErrorResponse {
		let blErrorResponse = {httpStatus: 500, code: blError.getCode(), message: 'server error'};
		
		if (!blError.getCode() || blError.getCode() === 0) blErrorResponse;
		
		if (blError.getCode() >= 900 && blError.getCode() <= 999) {
			return this.authErrorResponse(blError.getCode());
		}
	}
	
	private authErrorResponse(code: number): BlErrorResponse {
		let blErrorResponse = {httpStatus: 401, code: code, message: 'authentication failure'};
		
		switch (code) {
			case 901:
				blErrorResponse.message = 'password is wrong';
				break;
			case 902:
				blErrorResponse.message = 'user is not valid';
				break;
			case 903:
				blErrorResponse.message = 'username already exists';
				break;
			case 904:
				blErrorResponse.message = 'no permission';
				break;
			case 905:
				blErrorResponse.message = 'invalid token';
				break;
			case 906:
				blErrorResponse.message = 'token creation failed';
				break;
			case 907:
				blErrorResponse.message = 'user creation failed';
				blErrorResponse.httpStatus = 400;
				break;
			case 908:
				blErrorResponse.message = 'username or password is wrong';
				break;
		}
		
		
		return blErrorResponse;
	}
	
	
}