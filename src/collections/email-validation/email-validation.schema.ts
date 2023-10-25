import { Schema } from "mongoose";

import { EmailValidation } from "./email-validation";

export const emailValidationSchema = new Schema<EmailValidation>({
  email: {
    type: String,
    required: true,
  },
  userDetail: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  createdAt: {
    // IMPORTANT to have expiry
    type: Date,
    expires: 900, // 15 minutes
    default: Date.now,
  },
});
