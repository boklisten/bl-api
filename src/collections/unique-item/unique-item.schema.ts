import { UniqueItem } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const uniqueItemSchema = new Schema<UniqueItem>({
  blid: {
    type: String,
    required: true,
  },
  item: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  location: String,
  actions: [Schema.Types.Mixed],
});
