import { Hook } from "../../../hook/hook";
import { EmailValidation } from "../email-validation";
import { AccessToken, BlError } from "@boklisten/bl-model";
import { EmailValidationHelper } from "../helpers/email-validation.helper";

export class EmailValidationPostHook extends Hook {
  private _emailValidationHelper: EmailValidationHelper;

  constructor(emailValidationHelper?: EmailValidationHelper) {
    super();
    this._emailValidationHelper =
      emailValidationHelper ?? new EmailValidationHelper();
  }

  public override after(
    emailValidations: EmailValidation[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessToken?: AccessToken,
  ): Promise<EmailValidation[]> {
    return new Promise((resolve, reject) => {
      const emailValidation = emailValidations[0];

      this._emailValidationHelper
        .sendEmailValidationLink(emailValidation)
        .then(() => {
          resolve([emailValidation]);
        })
        .catch((sendValidationLinkError: BlError) => {
          reject(
            new BlError("could not send validation link").add(
              sendValidationLinkError,
            ),
          );
        });
    });
  }
}
