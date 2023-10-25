import { Schema } from "mongoose";

import { LocalLogin } from "./local-login";

export const localLoginSchema = new Schema<LocalLogin>({
  username: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  providerId: {
    type: String,
    required: true,
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
});
