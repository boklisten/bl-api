import { Schema } from "mongoose";

export const matchSchema = {
  sender: Schema.Types.Mixed,
  recievers: {
    type: [Schema.Types.Mixed],
  },
  items: {
    type: [Schema.Types.Mixed],
  },
  state: Schema.Types.String,
  events: [Schema.Types.Mixed],
  branch: Schema.Types.ObjectId,
  meetingPoint: Schema.Types.Mixed,
};
