import { Schema } from "mongoose";

export const bookingSchema = new Schema({
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
    required: true,
  },
  branch: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  booked: {
    type: Boolean,
    default: false,
  },
});
