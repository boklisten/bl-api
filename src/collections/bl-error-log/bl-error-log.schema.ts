import {Schema} from 'mongoose';

export const blErrorLogSchema = {
  code: Schema.Types.Number,
  className: Schema.Types.String,
  methodName: Schema.Types.String,
  msg: Schema.Types.String,
  errorStack: Schema.Types.Mixed,
  store: Schema.Types.Array,
  data: Schema.Types.Mixed,
};
