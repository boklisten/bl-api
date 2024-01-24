import { Schema } from "mongoose";

import { User } from "./user";

export const UserSchema = new Schema<User>({
  userDetail: Schema.Types.ObjectId,
  permission: {
    type: String,
    required: true,
  },
  login: {
    type: {
      provider: {
        type: String,
        required: true,
      },
      providerId: {
        type: String,
        required: true,
      },
    },
    required: true,
  },
  blid: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  valid: {
    type: Boolean,
    default: true,
  },
  primary: {
    type: Boolean,
  },
  movedToPrimary: Schema.Types.ObjectId,
  active: {
    type: Boolean,
    default: true,
  },
  lastRequest: {
    type: String,
  },
});
