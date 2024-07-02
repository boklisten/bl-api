import { Schema } from "mongoose";

import { EmailValidation } from "./email-validation";
import { ToSchema } from "../../helper/typescript-helpers";

export const emailValidationSchema = new Schema<ToSchema<EmailValidation>>({
  email: {
    type: String,
    required: true,
  },
  userDetail: Schema.Types.ObjectId,
});
