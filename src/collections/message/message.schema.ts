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
    default: 0
  },
  customerId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  info: {
    type: Schema.Types.Mixed,
    required: false,
  },
  events: {
    type: [Schema.Types.Mixed],
    required: false,
    default: [],
  },
  textBlocks: {
    type: [Schema.Types.Mixed],
    required: false,
  },
};
