import { Booking } from "@boklisten/bl-model";
import { Schema } from "mongoose";

import { ToSchema } from "../../helper/typescript-helpers";

export const bookingSchema = new Schema<ToSchema<Booking>>({
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
