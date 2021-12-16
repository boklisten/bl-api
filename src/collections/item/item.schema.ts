import { Schema } from "mongoose";

export const itemSchema = {
  title: {
    type: Schema.Types.String,
    required: true,
  },
  type: {
    type: Schema.Types.String,
    required: true,
  },
  digital: {
    type: Schema.Types.Boolean,
    default: false,
    required: false,
  },
  price: {
    type: Schema.Types.Number,
    required: true,
  },
  taxRate: {
    type: Schema.Types.Number,
    required: true,
  },
  info: {
    type: Schema.Types.Mixed,
    required: false,
  },
  buyback: {
    type: Schema.Types.Boolean,
    required: false,
    default: false,
  },
  desc: {
    type: Schema.Types.String,
    required: false,
  },
  categories: {
    type: [Schema.Types.String],
    default: [],
  },
};
