import {Operation} from "../../../operation/operation";
import {BlApiRequest} from "../../../request/bl-api-request";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {PasswordReset} from "../password-reset";
import {passwordResetSchema} from "../password-reset.schema";
import {BlError} from "@wizardcoder/bl-model";
import {Request, NextFunction, Response} from "express";


export class PasswordResetOperation implements Operation {
	private _passwordResetStorage: BlDocumentStorage<PasswordReset>;

	constructor(passwordResetStorage?: BlDocumentStorage<PasswordReset>) {
		this._passwordResetStorage = (passwordResetStorage) ? passwordResetStorage : new BlDocumentStorage('passwordresets', passwordResetSchema);
	}

	run(blApiRequest: BlApiRequest, req?: Request, res?: Response, next?: NextFunction): Promise<any> {
		return new Promise((resolve, reject) => {
			this._passwordResetStorage.get(blApiRequest.documentId).then((passwordReset: PasswordReset) => {
				let uri = process.env.CLIENT_URI + 'auth/password/' + passwordReset.id + '/reset';
				res.redirect(uri);

				resolve(true);

			}).catch((getPasswordResetError: BlError) => {
				reject(new BlError(`passwordReset "${blApiRequest.documentId}" not found`).code(702).add(getPasswordResetError));
			})
		});
	}
}