import { Delivery } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const deliverySchema = new Schema<Delivery>({
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
});
