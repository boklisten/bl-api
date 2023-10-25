import { Item } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const itemSchema = new Schema<Item>({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  digital: {
    type: Boolean,
    default: false,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    required: true,
  },
  info: {
    type: Schema.Types.Mixed,
    required: false,
  },
  buyback: {
    type: Boolean,
    required: false,
    default: false,
  },
  desc: {
    type: String,
    required: false,
  },
  categories: {
    type: [String],
    default: [],
  },
});
