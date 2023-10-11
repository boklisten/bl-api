import { PasswordResetPostHook } from "./hooks/password-reset-post.hook";
import { PasswordResetNewOperation } from "./operations/password-reset-new.operation";
import { PasswordResetOperation } from "./operations/password-reset.operation";
import { passwordResetSchema } from "./password-reset.schema";
import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";

export class PasswordResetCollection implements BlCollection {
  public collectionName = BlCollectionName.PasswordResets;
  public mongooseSchema = passwordResetSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      hook: new PasswordResetPostHook(),
    },
    {
      method: "getId",
      restriction: {
        permissions: ["super"],
      },
      operations: [
        {
          name: "reset",
          operation: new PasswordResetOperation(),
        },
      ],
    },
    {
      method: "patch",
      restriction: {
        permissions: ["super"],
      },
      operations: [
        {
          name: "new",
          operation: new PasswordResetNewOperation(),
        },
      ],
    },
  ];
}
