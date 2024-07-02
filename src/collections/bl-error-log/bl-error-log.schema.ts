import { Schema } from "mongoose";

import { BlErrorLog } from "./bl-error-log";
import { ToSchema } from "../../helper/typescript-helpers";

export const blErrorLogSchema = new Schema<ToSchema<BlErrorLog>>({
  code: Number,
  className: String,
  methodName: String,
  msg: String,
  errorStack: Schema.Types.Mixed,
  store: Schema.Types.Array,
  data: Schema.Types.Mixed,
});
