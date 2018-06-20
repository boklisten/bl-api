import {Operation} from "../../../operation/operation";
import {BlApiRequest} from "../../../request/bl-api-request";
import {NextFunction, Request, Response} from "express";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {BlapiResponse, BlError, UserDetail} from "@wizardcoder/bl-model";
import {userDetailSchema} from "../user-detail.schema";
import {SEResponseHandler} from "../../../response/se.response.handler";
import {isNullOrUndefined} from "util";


export class UserDetailValidOperation implements Operation {
	private _userDetailStorage: BlDocumentStorage<UserDetail>;
	private _resHandler: SEResponseHandler;

	constructor(userDetailStorage?: BlDocumentStorage<UserDetail>, resHandler?: SEResponseHandler) {
		this._userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this._resHandler = (resHandler) ? resHandler : new SEResponseHandler();
	}

	async run(blApiRequest: BlApiRequest, req?: Request, res?: Response, next?: NextFunction): Promise<boolean> {
		try {
			let userDetail = await this._userDetailStorage.get(blApiRequest.documentId);


			let invalidUserDetailFields = this.getInvalidUserDetailFields(userDetail);

			if (invalidUserDetailFields.length <= 0) {
				this._resHandler.sendResponse(res, new BlapiResponse([{valid: true}]));
			} else {
				this._resHandler.sendResponse(res, new BlapiResponse([{valid: false, invalidFields: invalidUserDetailFields}]));
			}

			return true;
		} catch (err) {
			let responseError: BlError = new BlError('userDetail could not be validated');

			if (err instanceof BlError) {
				responseError.add(err);
			}

			this._resHandler.sendErrorResponse(res, responseError);

			throw responseError;
		}
	}


	private getInvalidUserDetailFields(userDetail: UserDetail) {
		let invalidFields = [];

		if (isNullOrUndefined(userDetail.name) || userDetail.name.length <= 0) {
			invalidFields.push('name');
		}

		if (isNullOrUndefined(userDetail.address) || userDetail.address.length <= 0) {
			invalidFields.push('address')
		}

		if (isNullOrUndefined(userDetail.postCode) || userDetail.postCode.length <= 0) {
			invalidFields.push('postCode');
		}

		if (isNullOrUndefined(userDetail.postCity) || userDetail.postCity.length <= 0) {
			invalidFields.push('postCity');
		}

		if (isNullOrUndefined(userDetail.phone) || userDetail.phone.length <= 0) {
			invalidFields.push('phone');
		}

		if (isNullOrUndefined(userDetail.emailConfirmed) || !userDetail.emailConfirmed) {
			invalidFields.push('emailConfirmed');
		}

		if (isNullOrUndefined(userDetail.dob)) {
			invalidFields.push('dob');
		}

		return invalidFields;
	}
}
