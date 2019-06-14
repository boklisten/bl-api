import {Schema} from 'mongoose';

export const messageSchema = {
  messageType: {
    type: Schema.Types.String,
    required: true,
  },
  messageSubtype: {
    type: Schema.Types.String,
    required: true,
  },
  messageMethod: {
    type: Schema.Types.String,
    required: true,
  },
  sequenceNumber: {
    type: Schema.Types.Number,
    default: 0,
  },
  customerId: {
    type: Schema.Types.String,
    required: true,
  },
  employeeId: {
    type: Schema.Types.String,
    required: false,
  },
  info: {
    type: Schema.Types.Mixed,
    required: false,
  },
  subject: {
    type: Schema.Types.String,
    required: false,
  },
  htmlContent: {
    type: Schema.Types.String,
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
