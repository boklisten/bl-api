import { emailValidationSchema } from "./email-validation.schema";
import { EmailValidationPostHook } from "./hooks/email-validation-post.hook";
import { EmailValidationConfirmOperation } from "./operations/email-validation-confirm.operation";
import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";

export class EmailValidationCollection implements BlCollection {
  public collectionName = BlCollectionName.EmailValidations;
  public mongooseSchema = emailValidationSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      hook: new EmailValidationPostHook(),
      restriction: {
        permissions: ["customer", "employee", "manager", "admin", "super"],
        restricted: true,
      },
    },
    {
      method: "patch",
      restriction: {
        permissions: ["super"],
      },
      operations: [
        {
          name: "confirm",
          operation: new EmailValidationConfirmOperation(),
        },
      ],
    },
  ];
}
