import { Schema } from "mongoose";

export const uniqueItemSchema = {
  blid: {
    type: Schema.Types.String,
    required: true,
  },
  item: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  title: {
    type: Schema.Types.String,
    required: true,
  },
  location: {
    type: Schema.Types.Mixed,
  },
  actions: {
    type: [Schema.Types.Mixed],
  },
};
