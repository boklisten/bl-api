import { Schema } from "mongoose";

export const paymentSchema = {
  method: {
    type: Schema.Types.String,
    required: true,
  },
  order: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  amount: {
    type: Schema.Types.Number,
    required: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  branch: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  taxAmount: {
    type: Schema.Types.Number,
    required: true,
  },
  info: {
    type: Schema.Types.Mixed,
    required: false,
  },
  confirmed: {
    type: Schema.Types.Boolean,
    default: false,
  },
  discount: {
    type: {
      amount: {
        type: Schema.Types.Number,
        required: true,
      },
      coupon: Schema.Types.String,
    },
    required: false,
  },
};
