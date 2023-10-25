import { Schema } from "mongoose";

export const blErrorLogSchema = new Schema({
  code: Number,
  className: String,
  methodName: String,
  msg: String,
  errorStack: Schema.Types.Mixed,
  store: Schema.Types.Array,
  data: Schema.Types.Mixed,
});
