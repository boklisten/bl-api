import { CustomerItem } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const customerItemSchema = new Schema<CustomerItem>({
  item: {
    type: Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: String,
  },
  age: String,
  blid: String,
  customer: {
    type: Schema.Types.Mixed,
    require: true,
  },
  sharedItem: Schema.Types.ObjectId,
  deadline: {
    type: Date,
    required: true,
  },
  digital: Boolean,
  digitalInfo: Schema.Types.Mixed,
  match: {
    type: Boolean,
    default: false,
  },
  matchInfo: {
    id: Schema.Types.ObjectId,
    time: Date,
  },
  handout: Boolean,
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
    time: Date,
  },
  returned: {
    type: Boolean,
    required: true,
  },
  returnInfo: {
    returnedTo: String,
    returnedToId: Schema.Types.ObjectId,
    returnEmployee: Schema.Types.ObjectId,
    time: Date,
  },
  cancel: Boolean,
  cancelInfo: {
    order: Schema.Types.ObjectId,
    time: Date,
  },
  buyout: Boolean,
  buyoutInfo: {
    order: Schema.Types.ObjectId,
    time: Date,
  },
  buyback: Boolean,
  buybackInfo: {
    order: Schema.Types.ObjectId,
    time: Date,
  },

  orders: [Schema.Types.ObjectId],
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
  totalAmount: Number,
  amountLeftToPay: Number,
  customerInfo: {
    name: String,
    phone: String,
    address: String,
    postCode: String,
    postCity: String,
    dob: Date,
    guardian: {
      name: String,
      email: String,
      phone: String,
    },
  },
});
