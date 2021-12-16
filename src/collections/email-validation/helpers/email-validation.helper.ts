import { Messenger } from "../../../messenger/messenger";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlError, UserDetail } from "@boklisten/bl-model";
import { EmailValidation } from "../email-validation";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { emailValidationSchema } from "../email-validation.schema";
import { SystemUser } from "../../../auth/permission/permission.service";

export class EmailValidationHelper {
  private _messenger: Messenger;
  private _userDetailStorage: BlDocumentStorage<UserDetail>;
  private _emailValidationStorage?: BlDocumentStorage<EmailValidation>;

  constructor(
    messenger?: Messenger,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    emailValidationStorage?: BlDocumentStorage<EmailValidation>
  ) {
    this._messenger = messenger ? messenger : new Messenger();
    this._userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
    this._emailValidationStorage = emailValidationStorage
      ? emailValidationStorage
      : new BlDocumentStorage("email_validations", emailValidationSchema);
  }

  public createAndSendEmailValidationLink(
    userDetailId: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._userDetailStorage
        .get(userDetailId)
        .then((userDetail: UserDetail) => {
          const emailValidation = {
            email: userDetail.email,
            userDetail: userDetail.id,
          } as EmailValidation;

          this._emailValidationStorage
            .add(emailValidation, new SystemUser())
            .then((addedEmailValidation: EmailValidation) => {
              this._messenger.emailConfirmation(
                userDetail,
                addedEmailValidation.id
              );

              resolve(true);
            })
            .catch((addEmailValidationError: BlError) => {
              reject(
                new BlError("could not add emailValidation").add(
                  addEmailValidationError
                )
              );
            });
        })
        .catch((getUserDetailError: BlError) => {
          reject(
            new BlError(`userDetail "${userDetailId}" not found`).add(
              getUserDetailError
            )
          );
        });
    });
  }

  public sendEmailValidationLink(
    emailValidation: EmailValidation
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._userDetailStorage
        .get(emailValidation.userDetail)
        .then((userDetail: UserDetail) => {
          this._messenger.emailConfirmation(userDetail, emailValidation.id);

          resolve(true);
        })
        .catch((getUserDetailError: BlError) => {
          reject(
            new BlError(
              `userDetail "${emailValidation.userDetail}" not found`
            ).add(getUserDetailError)
          );
        });
    });
  }
}
