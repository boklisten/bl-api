import { Schema } from "mongoose";

export const bookingSchema = {
  from: {
    type: Schema.Types.Date,
    required: true
  },
  to: {
    type: Schema.Types.Date,
    required: true
  },
  branch: {
    type: Schema.Types.ObjectId,
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    required: false
  },
  booked: {
    type: Schema.Types.Boolean,
    default: false
  }
};
