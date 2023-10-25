import { Schema } from "mongoose";

export const deliverySchema = {
  method: {
    type: String,
    required: true,
  },
  info: {
    type: Schema.Types.Mixed,
    required: true,
  },
  order: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
};
