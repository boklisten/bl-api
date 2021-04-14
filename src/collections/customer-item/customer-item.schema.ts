import { Schema } from "mongoose";

export const customerItemSchema = {
  item: {
    type: Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: Schema.Types.String,
    required: false,
  },
  age: {
    type: Schema.Types.String,
  },
  blid: {
    type: Schema.Types.String,
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
    type: Schema.Types.Date,
    required: true,
  },
  state: {
    type: Schema.Types.String,
  },
  digital: {
    type: Schema.Types.Boolean,
    default: false,
  },
  digitalInfo: {
    type: Schema.Types.Mixed,
  },
  match: {
    type: Schema.Types.Boolean,
    default: false,
  },
  matchInfo: {
    type: {
      id: Schema.Types.ObjectId,
      time: Schema.Types.Date,
    },
  },
  handout: {
    type: Schema.Types.Boolean,
    default: false,
  },
  handoutInfo: {
    handoutBy: {
      type: Schema.Types.String,
      required: true,
    },
    handoutById: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    handoutEmployee: Schema.Types.ObjectId,
    time: {
      type: Schema.Types.Date,
    },
  },
  returned: {
    type: Schema.Types.Boolean,
    required: true,
  },
  returnInfo: {
    type: {
      returnedTo: {
        type: Schema.Types.String,
        required: true,
      },
      returnedToId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      returnEmployee: Schema.Types.ObjectId,
      time: {
        type: Schema.Types.Date,
        required: true,
      },
    },
    required: false,
  },
  cancel: {
    type: Schema.Types.Boolean,
    default: false,
  },
  cancelInfo: {
    type: {
      order: {
        type: Schema.Types.ObjectId,
      },
      time: {
        type: Schema.Types.Date,
      },
    },
    required: false,
  },
  buyout: {
    type: Schema.Types.Boolean,
    default: false,
  },
  buyoutInfo: {
    type: {
      order: {
        type: Schema.Types.ObjectId,
      },
      time: {
        type: Schema.Types.Date,
      },
    },
    required: false,
  },
  buyback: {
    type: Schema.Types.Boolean,
    default: false,
  },
  buybackInfo: {
    type: {
      order: {
        type: Schema.Types.ObjectId,
      },
      time: {
        type: Schema.Types.Date,
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
          type: Schema.Types.Date,
          required: true,
        },
        to: {
          type: Schema.Types.Date,
          required: true,
        },
        periodType: {
          type: Schema.Types.String,
          required: true,
        },
        time: {
          type: Schema.Types.Date,
          required: true,
        },
      },
    ],
    default: [],
  },
  totalAmount: {
    type: Schema.Types.Number,
    required: false,
  },
  amountLeftToPay: {
    type: Schema.Types.Number,
    required: false,
  },
  customerInfo: {
    type: {
      name: Schema.Types.String,
      phone: Schema.Types.String,
      address: Schema.Types.String,
      postCode: Schema.Types.String,
      postCity: Schema.Types.String,
      dob: Schema.Types.Date,
      guardian: {
        type: {
          name: Schema.Types.String,
          email: Schema.Types.String,
          phone: Schema.Types.String,
        },
        required: false,
      },
    },
    required: false,
  },
};
