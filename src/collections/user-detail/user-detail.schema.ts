import { Schema } from "mongoose";

export let userDetailSchema = {
  name: {
    type: Schema.Types.String,
  },
  email: {
    type: Schema.Types.String,
    required: true,
  },
  phone: {
    type: Schema.Types.String,
  },
  address: {
    type: Schema.Types.String,
  },
  postCode: {
    type: Schema.Types.String,
  },
  postCity: {
    type: Schema.Types.String,
  },
  country: {
    type: Schema.Types.String,
  },
  emailConfirmed: {
    type: Schema.Types.Boolean,
    default: false,
  },
  dob: {
    type: Schema.Types.Date,
  },
  branch: {
    type: Schema.Types.ObjectId,
  },
  lastActive: {
    type: Schema.Types.Date,
    default: Date.now(),
  },
  guardian: {
    name: {
      type: Schema.Types.String,
    },
    email: {
      type: Schema.Types.String,
    },
    emailConfirmed: {
      type: Schema.Types.Boolean,
    },
    phone: {
      type: Schema.Types.String,
    },
    confirmed: {
      type: Schema.Types.Boolean,
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
};
