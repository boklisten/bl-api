import { PendingPasswordReset } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const pendingPasswordResetSchema = new Schema<PendingPasswordReset>({
  _id: {
    type: Schema.Types.String,
    required: true,
  },
  email: {
    type: Schema.Types.String,
    required: true,
  },
  tokenHash: {
    type: Schema.Types.String,
    required: true,
  },
  salt: {
    type: Schema.Types.String,
    required: true,
  },
});
