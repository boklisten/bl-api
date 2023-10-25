export const companySchema = {
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
};
