import { PendingPasswordResetPostHook } from "./hooks/pending-password-reset-post.hook";
import { ConfirmPendingPasswordResetOperation } from "./operations/confirm-pending-password-reset.operation";
import { pendingPasswordResetSchema } from "./pending-password-reset.schema";
import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";

export class PendingPasswordResetCollection implements BlCollection {
  public collectionName = BlCollectionName.PendingPasswordResets;
  public mongooseSchema = pendingPasswordResetSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      hook: new PendingPasswordResetPostHook(),
    },
    {
      method: "patch",
      restriction: {
        permissions: ["super"],
      },
      operations: [
        {
          name: "confirm",
          operation: new ConfirmPendingPasswordResetOperation(),
        },
      ],
    },
  ];
}
