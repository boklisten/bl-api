import { Schema } from "mongoose";

export const localLoginSchema = {
  username: {
    type: Schema.Types.String,
    required: true,
  },
  provider: {
    type: Schema.Types.String,
    required: true,
  },
  providerId: {
    type: Schema.Types.String,
    required: true,
  },
  hashedPassword: {
    type: Schema.Types.String,
    required: true,
  },
  salt: {
    type: Schema.Types.String,
    required: true,
  },
};
