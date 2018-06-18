import {Hook} from "../../../hook/hook";
import {EmailValidation} from "../email-validation";
import {AccessToken, BlError} from "@wizardcoder/bl-model";
import {EmailValidationHelper} from "../helpers/email-validation.helper";

export class EmailValidationPostHook extends Hook {
	private _emailValidationHelper: EmailValidationHelper;

	constructor(emailValidationHelper?: EmailValidationHelper) {
		super();
		this._emailValidationHelper = (emailValidationHelper) ? emailValidationHelper : new EmailValidationHelper();
	}

	public after(emailValidations: EmailValidation[], accessToken?: AccessToken): Promise<EmailValidation[]> {
		return new Promise((resolve, reject) => {
			let emailValidation = emailValidations[0];

			this._emailValidationHelper.sendEmailValidationLink(emailValidation).then(() => {
				resolve([emailValidation]);
			}).catch((sendValidationLinkError: BlError) => {
				reject(new BlError('could not send validation link').add(sendValidationLinkError));
			});

		});
	}


}