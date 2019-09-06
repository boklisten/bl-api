import {Schema} from 'mongoose';

export const invoiceSchema = {
  duedate: {
    type: Schema.Types.Date,
    required: true,
  },
  customerHavePayed: {
    type: Schema.Types.Boolean,
    default: false,
  },
  branch: Schema.Types.ObjectId,
  toCreditNote: {
    type: Schema.Types.Boolean,
    default: false,
  },
  type: {
    type: Schema.Types.String,
  },
  toDebtCollection: {
    type: Schema.Types.Boolean,
    default: false,
  },
  customerItemPayments: {
    type: [
      {
        customerItem: Schema.Types.ObjectId,
        title: Schema.Types.String,
        item: Schema.Types.ObjectId,
        numberOfItems: Schema.Types.String,
        customerNumber: Schema.Types.String,
        cancel: Schema.Types.Boolean,
        customerItemType: Schema.Types.String,
        organizationNumber: Schema.Types.String,
        payment: {
          unit: Schema.Types.Number,
          gross: Schema.Types.Number,
          net: Schema.Types.Number,
          vat: Schema.Types.Number,
          discount: Schema.Types.Number,
        },
      },
    ],
    default: [],
  },
  customerInfo: {
    type: {
      userDetail: Schema.Types.String,
      name: Schema.Types.String,
      email: Schema.Types.String,
      phone: Schema.Types.String,
      postal: {
        address: Schema.Types.String,
        city: Schema.Types.String,
        code: Schema.Types.String,
        country: Schema.Types.String,
      },
    },
    required: true,
  },
  payment: {
    type: {
      total: {
        gross: Schema.Types.Number,
        net: Schema.Types.Number,
        vat: Schema.Types.Number,
        discount: Schema.Types.Number,
      },
      fee: {
        unit: Schema.Types.Number,
        gross: Schema.Types.Number,
        net: Schema.Types.Number,
        vat: Schema.Types.Number,
        discount: Schema.Types.Number,
      },
    },
    required: true,
  },
  ourReference: Schema.Types.String,
  invoiceId: Schema.Types.String,
  reference: Schema.Types.String,
};
