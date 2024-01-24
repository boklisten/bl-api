import { Schema } from "mongoose";

import { EmailValidation } from "./email-validation";

export const emailValidationSchema = new Schema<EmailValidation>({
  email: {
    type: String,
    required: true,
  },
  userDetail: Schema.Types.ObjectId,
});
