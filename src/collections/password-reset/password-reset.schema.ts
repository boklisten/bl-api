import { Schema } from "mongoose";

import { PasswordReset } from "./password-reset";

export const passwordResetSchema = new Schema<PasswordReset>({
  email: {
    type: String,
    required: true,
  },
  userDetail: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    // IMPORTANT to have expiry
    type: Date,
    expires: 900, // 15 minutes
    default: Date.now,
  },
});
