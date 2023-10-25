import { OpeningHour } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const openingHourSchema = new Schema<OpeningHour>({
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
});
