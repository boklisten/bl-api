import { Schema } from "mongoose";

export const openingHourSchema = {
  from: {
    type: Schema.Types.Date,
    required: true,
  },
  to: {
    type: Schema.Types.Date,
    required: true,
  },
  branch: {
    type: Schema.Types.ObjectId,
    required: true,
  },
};
