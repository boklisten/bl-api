import {Schema} from 'mongoose';

export const branchItemSchema = {
  branch: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  item: {
    type: Schema.Types.ObjectId,
    required: true,
  },

  rent: {
    type: Schema.Types.Boolean,
    default: false,
  },
  partlyPayment: {
    type: Schema.Types.Boolean,
    default: false,
  },
  buy: {
    type: Schema.Types.Boolean,
    default: false,
  },
  sell: {
    type: Schema.Types.Boolean,
    default: false,
  },
  live: {
    type: Schema.Types.Boolean,
    default: false,
  },

  rentAtBranch: {
    type: Schema.Types.Boolean,
    default: false,
  },
  partlyPaymentAtBranch: {
    type: Schema.Types.Boolean,
    default: false,
  },
  buyAtBranch: {
    type: Schema.Types.Boolean,
    default: false,
  },
  sellAtBranch: {
    type: Schema.Types.Boolean,
    default: false,
  },
  liveAtBranch: {
    type: Schema.Types.Boolean,
    default: false,
  },

  sharedItems: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  categories: {
    type: [Schema.Types.String],
    default: [],
  },
};
