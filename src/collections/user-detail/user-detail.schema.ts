import { Schema } from "mongoose";

export const userDetailSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  postCode: {
    type: String,
  },
  postCity: {
    type: String,
  },
  country: {
    type: String,
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  dob: {
    type: Date,
  },
  branch: {
    type: Schema.Types.ObjectId,
  },
  lastActive: {
    type: Date,
    default: Date.now(),
  },
  guardian: {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    emailConfirmed: {
      type: Boolean,
    },
    phone: {
      type: String,
    },
    confirmed: {
      type: Boolean,
    },
  },
  customerItems: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  orders: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
});
