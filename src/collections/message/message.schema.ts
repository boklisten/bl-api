import { Schema } from 'mongoose';

export const messageSchema = {
  messageType: {
    type: Schema.Types.String,
    required: true
  },
  messageMethod: {
    type: Schema.Types.String,
    required: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    required: false
  },
  info: {
    type: Schema.Types.Mixed,
    required: false
  },
  textBlocks: {
    type: [Schema.Types.Mixed],
    required: false
  }
}
