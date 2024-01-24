import { UniqueItem } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const uniqueItemSchema = new Schema<UniqueItem>({
  blid: {
    type: String,
    required: true,
  },
  item: Schema.Types.ObjectId,
  title: {
    type: String,
    required: true,
  },
  location: {
    type: Schema.Types.Mixed,
  },
  actions: [Schema.Types.Mixed],
});
