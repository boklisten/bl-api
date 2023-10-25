import { Schema } from "mongoose";

export const branchSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  desc: {
    type: String,
    required: false,
  },
  root: {
    type: Boolean,
    required: false,
  },
  childBranches: {
    type: [Schema.Types.ObjectId],
    default: [],
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
    country: {
      type: String,
    },
    locationDesc: {
      type: String,
    },
    location: {
      type: {
        latitude: {
          type: String,
          required: true,
        },
        longitude: {
          type: String,
          required: true,
        },
      },
      required: false,
    },
    required: false,
  },
  paymentInfo: {
    type: {
      responsible: {
        type: Boolean,
        default: false,
        required: true,
      },
      responsibleForDelivery: {
        type: Boolean,
        default: false,
        required: false,
      },
      partlyPaymentPeriods: {
        type: [
          {
            type: String,
            date: Date,
            percentageBuyout: Number,
            percentageBuyoutUsed: Number,
            percentageUpFront: Number,
            percentageUpFrontUsed: Number,
          },
        ],
        default: [],
      },
      rentPeriods: {
        type: [
          {
            type: String,
            maxNumberOfPeriods: Number,
            date: Date,
            percentage: Number,
          },
        ],
        default: [],
      },
      extendPeriods: {
        type: [
          {
            type: String,
            maxNumberOfPeriods: Number,
            price: Number,
            date: Date,
            percentage: {
              type: Number,
              required: false,
            },
          },
        ],
        default: [],
      },
      buyout: {
        type: {
          percentage: Number,
        },
        default: 1,
      },
      sell: {
        type: {
          percentage: Number,
        },
        default: 1,
      },
      acceptedMethods: {
        type: [String],
        default: [],
      },
      payLater: {
        type: Boolean,
        default: false,
      },
    },
    required: true,
    default: {
      responsible: false,
      rentPeriods: [],
      extendPeriods: [],
      buyout: {
        percentage: 1,
      },
      sell: {
        percentage: 1,
      },
      acceptedMethods: [],
    },
  },
  deliveryMethods: {
    branch: {
      type: Boolean,
      default: true,
    },
    byMail: {
      type: Boolean,
      default: true,
    },
  },
  isBranchItemsLive: {
    type: {
      online: Boolean,
      atBranch: Boolean,
    },
    default: {
      online: false,
      atBranch: false,
    },
    required: false,
  },
  branchItems: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  openingHours: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  location: {
    type: Schema.Types.Mixed,
    required: false,
  },
});
