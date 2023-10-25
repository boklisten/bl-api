import { Company } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const companySchema = new Schema<Company>({
  name: {
    type: String,
    required: true,
  },
  viewableFor: [String],
  contactInfo: {
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    address: {
      type: String,
    },
    postCode: {
      type: String,
    },
    postCity: {
      type: String,
    },
  },
  customerNumber: {
    type: String,
  },
  organizationNumber: {
    type: String,
  },
});
