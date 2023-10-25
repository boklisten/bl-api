import { Schema } from "mongoose";

export const messageSchema = {
  messageType: {
    type: String,
    required: true,
  },
  messageSubtype: {
    type: String,
    required: true,
  },
  messageMethod: {
    type: String,
    required: true,
  },
  sequenceNumber: {
    type: Number,
    default: 0,
  },
  customerId: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    required: false,
  },
  info: {
    type: Schema.Types.Mixed,
    required: false,
  },
  subject: {
    type: String,
    required: false,
  },
  htmlContent: {
    type: String,
    required: false,
  },
  events: {
    type: [Schema.Types.Mixed],
    required: false,
    default: [],
  },

  smsEvents: {
    type: [Schema.Types.Mixed],
    required: false,
    default: [],
  },
  textBlocks: {
    type: [Schema.Types.Mixed],
    required: false,
  },
};
