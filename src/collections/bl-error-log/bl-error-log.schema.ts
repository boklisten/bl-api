import { Schema } from "mongoose";

export const blErrorLogSchema = {
  code: Number,
  className: String,
  methodName: String,
  msg: String,
  errorStack: Schema.Types.Mixed,
  store: Schema.Types.Array,
  data: Schema.Types.Mixed,
};
