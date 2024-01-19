import { UserDetail } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const userDetailSchema = new Schema<UserDetail>({
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
  customerItems: [Schema.Types.ObjectId],
  orders: [Schema.Types.ObjectId],
});
