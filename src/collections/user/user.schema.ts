import { Schema } from "mongoose";

export const UserSchema = new Schema({
  userDetail: {
    type: Schema.Types.ObjectId,
  },
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
  movedToPrimary: {
    type: Schema.Types.ObjectId,
  },
  active: {
    type: Boolean,
    default: true,
  },
  lastActive: {
    type: Date,
    default: new Date(),
  },
  lastRequest: {
    type: String,
  },
});
