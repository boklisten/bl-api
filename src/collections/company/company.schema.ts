import { Schema } from "mongoose";

export const companySchema = {
  name: {
    type: Schema.Types.String,
    required: true,
  },
  viewableFor: [Schema.Types.String],
  contactInfo: {
    phone: {
      type: Schema.Types.String,
    },
    email: {
      type: Schema.Types.String,
    },
    address: {
      type: Schema.Types.String,
    },
    postCode: {
      type: Schema.Types.String,
    },
    postCity: {
      type: Schema.Types.String,
    },
  },
  customerNumber: {
    type: Schema.Types.String,
  },
  organizationNumber: {
    type: Schema.Types.String,
  },
};
