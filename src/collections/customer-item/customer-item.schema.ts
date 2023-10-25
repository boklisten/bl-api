import { Schema } from "mongoose";

export const customerItemSchema = new Schema({
  item: {
    type: Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  age: {
    type: String,
  },
  blid: {
    type: String,
  },
  customer: {
    type: Schema.Types.Mixed,
    require: true,
  },
  sharedItem: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  deadline: {
    type: Date,
    required: true,
  },
  state: {
    type: String,
  },
  digital: {
    type: Boolean,
    default: false,
  },
  digitalInfo: {
    type: Schema.Types.Mixed,
  },
  match: {
    type: Boolean,
    default: false,
  },
  matchInfo: {
    type: {
      id: Schema.Types.ObjectId,
      time: Date,
    },
  },
  handout: {
    type: Boolean,
    default: false,
  },
  handoutInfo: {
    handoutBy: {
      type: String,
      required: true,
    },
    handoutById: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    handoutEmployee: Schema.Types.ObjectId,
    time: {
      type: Date,
    },
  },
  returned: {
    type: Boolean,
    required: true,
  },
  returnInfo: {
    type: {
      returnedTo: {
        type: String,
        required: true,
      },
      returnedToId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      returnEmployee: Schema.Types.ObjectId,
      time: {
        type: Date,
        required: true,
      },
    },
    required: false,
  },
  cancel: {
    type: Boolean,
    default: false,
  },
  cancelInfo: {
    type: {
      order: {
        type: Schema.Types.ObjectId,
      },
      time: {
        type: Date,
      },
    },
    required: false,
  },
  buyout: {
    type: Boolean,
    default: false,
  },
  buyoutInfo: {
    type: {
      order: {
        type: Schema.Types.ObjectId,
      },
      time: {
        type: Date,
      },
    },
    required: false,
  },
  buyback: {
    type: Boolean,
    default: false,
  },
  buybackInfo: {
    type: {
      order: {
        type: Schema.Types.ObjectId,
      },
      time: {
        type: Date,
      },
    },
    required: false,
  },

  orders: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  periodExtends: {
    type: [
      {
        from: {
          type: Date,
          required: true,
        },
        to: {
          type: Date,
          required: true,
        },
        periodType: {
          type: String,
          required: true,
        },
        time: {
          type: Date,
          required: true,
        },
      },
    ],
    default: [],
  },
  totalAmount: {
    type: Number,
    required: false,
  },
  amountLeftToPay: {
    type: Number,
    required: false,
  },
  customerInfo: {
    type: {
      name: String,
      phone: String,
      address: String,
      postCode: String,
      postCity: String,
      dob: Date,
      guardian: {
        type: {
          name: String,
          email: String,
          phone: String,
        },
        required: false,
      },
    },
    required: false,
  },
});
