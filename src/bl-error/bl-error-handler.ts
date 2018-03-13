

import {BlError} from "bl-model";
import {BlapiErrorResponse} from "bl-model";
const chalk = require('chalk');


export class BlErrorHandler {
	
	public createBlapiErrorResponse(blError: BlError): BlapiErrorResponse {
		this.printErrorStack(blError);
		
		let blErrorResponse = this.getErrorResponse(blError);
		return new BlapiErrorResponse(blErrorResponse.httpStatus, blErrorResponse.code, blErrorResponse.msg);
	}
	
	private printErrorStack(blError: BlError) {
		this.printBlError(blError);
		console.log();
	}
	
	private printBlError(blError: BlError) {
		if (!(blError instanceof BlError)) {
			console.log(chalk.blue('\t#' + chalk.bold.red(' unkown error') + ' ' + chalk.green(blError)));
			return;
		}
		
		console.log(chalk.blue('\t# [' + blError.getCode() + '] ') + chalk.red(blError.getMsg()))
		
		//console.log('\t\t\t ' + chalk.dim(blError.stack));
		
		if (blError.getStore() && blError.getStore().length > 0) {
			console.log('\t\t ' + chalk.blue('# ') + chalk.green('stored error data'));
			for (let storeData of blError.getStore()) {
				console.log('\t\t\t' + chalk.blue('key: ') + chalk.green(storeData.key), chalk.dim(JSON.stringify(storeData.value)));
			}
		}
		
		if (blError.errorStack && blError.errorStack.length > 0) {
			for (let err of blError.errorStack) {
				this.printBlError(err);
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
				blapiErrorResponse.msg = 'bad format';
				break;
			case 702:
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
				blapiErrorResponse.msg = 'username already exists';
				break;
			case 904:
				blapiErrorResponse.msg = 'no permission';
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