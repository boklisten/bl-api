

import {BlError, BlapiErrorResponse} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../storage/blDocumentStorage";
import {BlErrorLog} from "../collections/bl-error-log/bl-error-log";
import {blErrorLogSchema} from "../collections/bl-error-log/bl-error-log.schema";
import {logger} from "../logger/logger";
const chalk = require('chalk');


export class BlErrorHandler {
	private _errorLogStorage: BlDocumentStorage<BlErrorLog>;

	constructor() {
		this._errorLogStorage = new BlDocumentStorage<BlErrorLog>('blerrorlogs', blErrorLogSchema);
	}
	
	public createBlapiErrorResponse(err): BlapiErrorResponse {
		let blError = err;

		if (!(err instanceof BlError)) {
			blError = new BlError('unknown error').store('error', err);
		}


		this.printErrorStack(blError);
		this.storeError(blError);

		let blErrorResponse = this.getErrorResponse(blError);


		return new BlapiErrorResponse(blErrorResponse.httpStatus, blErrorResponse.code, blErrorResponse.msg);
	}

	private storeError(blError: BlError) {
		this._errorLogStorage.add(new BlErrorLog(blError), {id: 'SYSTEM', permission: 'admin'}).then((addedErrorLog) => {

		}).catch((blErrorAddError) => {
			logger.warn('blErrorHandler: there was a error saving the BlErrorLog: ' + blErrorAddError);
		});
	}

	private printErrorStack(blError: BlError) {
		this.printBlError(blError);
	}
	
	private printBlError(blError: BlError) {
		if (!(blError instanceof BlError)) {
			logger.debug('! ' + 'unknown error' + ' ' + blError);
			return;
		}

		if (blError.errorStack && blError.errorStack.length > 0) {
			for (let err of blError.errorStack) {
				this.printBlError(err);
			}
		}

		logger.debug('! ' + '(' + blError.getCode() + ') ' + blError.getMsg());


		if (blError.getStore() && blError.getStore().length > 0) {
			logger.debug(chalk.magenta('stored error data:'));
			for (let storeData of blError.getStore()) {
				logger.debug('\t' + 'key: ' + storeData.key)
				let data: any = '';

				data = JSON.stringify(storeData.value);

				if (Object.getOwnPropertyNames(data).length <= 0 || data === '{}') {
					data = storeData.value;
				}

				logger.debug('\t' + 'value: ', data);
			}
		}

	}
	
	private getErrorResponse(blError: BlError): BlapiErrorResponse {
		let blapiErrorResponse: BlapiErrorResponse = {httpStatus: 500, code: blError.getCode(), msg: 'server error', data: null};
		
		if (!blError.getCode() || blError.getCode() === 0) return blapiErrorResponse;
		else if (blError.getCode() >= 200 && blError.getCode() <= 299) return this.serverErrorResponse(blError.getCode());
		else if (blError.getCode() >= 700 && blError.getCode() <= 799) return this.documentErrorResponse(blError.getCode());
		else if (blError.getCode() >= 800 && blError.getCode() <= 899) return this.requestErrorResponse(blError.getCode());
		else if (blError.getCode() >= 900 && blError.getCode() <= 999) return this.authErrorResponse(blError.getCode());
		else return blapiErrorResponse;
	}
	
	private serverErrorResponse(code: number): BlapiErrorResponse {
		let blapiErrorResponse: BlapiErrorResponse = {httpStatus: 500, code: code, msg: 'server error', data: null};
		
		switch (code) {
			case 200:
				blapiErrorResponse.msg = 'server error';
				break;
		}
		
		return blapiErrorResponse;
	}
	
	private requestErrorResponse(code: number): BlapiErrorResponse {
		let blapiErrorResponse: BlapiErrorResponse = {httpStatus: 500, code: code, msg: 'server error', data: null};
		
		switch (code) {
			case 800:
				blapiErrorResponse.msg = 'server error';
				break
		}
		
		return blapiErrorResponse;
	}
	
	private documentErrorResponse(code: number): BlapiErrorResponse {
		let blapiErrorResponse: BlapiErrorResponse = {httpStatus: 400, code: code, msg: 'bad format', data: null};
		
		switch (code) {
			case 701:
				blapiErrorResponse.httpStatus = 400;
				blapiErrorResponse.msg = 'bad format';
				break;
			case 702:
				blapiErrorResponse.httpStatus = 404;
				blapiErrorResponse.msg = 'not found';
				break;
		}
		return blapiErrorResponse;
	}
	
	private authErrorResponse(code: number): BlapiErrorResponse {
		let blapiErrorResponse: BlapiErrorResponse = {httpStatus: 401, code: code, msg: 'authentication failure', data: null};
		
		switch (code) {
			case 901:
				blapiErrorResponse.msg = 'password is wrong';
				break;
			case 902:
				blapiErrorResponse.msg = 'user is not valid';
				break;
			case 903:
				blapiErrorResponse.httpStatus = 400;
				blapiErrorResponse.msg = 'username already exists';
				break;
			case 904:
				blapiErrorResponse.httpStatus = 403;
				blapiErrorResponse.msg = 'forbidden';
				break;
			case 905:
				blapiErrorResponse.msg = 'invalid token';
				break;
			case 906:
				blapiErrorResponse.msg = 'token creation failed';
				break;
			case 907:
				blapiErrorResponse.msg = 'user creation failed';
				blapiErrorResponse.httpStatus = 400;
				break;
			case 908:
				blapiErrorResponse.msg = 'username or password is wrong';
				break;
			case 909:
				blapiErrorResponse.msg = 'refreshToken not valid';
				break;
		}
		
		
		return blapiErrorResponse;
	}
	
	
}