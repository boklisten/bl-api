import { BlCollection, BlEndpoint } from "../bl-collection";
import { emailValidationSchema } from "./email-validation.schema";
import { EmailValidationConfirmOperation } from "./operations/email-validation-confirm.operation";
import { Schema } from "mongoose";
import { EmailValidationPostHook } from "./hooks/email-validation-post.hook";

export class EmailValidationCollection implements BlCollection {
  public collectionName = "email_validations";
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
