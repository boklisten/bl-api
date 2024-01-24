import { Booking } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const bookingSchema = new Schema<Booking>({
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
    required: true,
  },
  branch: Schema.Types.ObjectId,
  customer: Schema.Types.ObjectId,
  booked: {
    type: Boolean,
    default: false,
  },
});
