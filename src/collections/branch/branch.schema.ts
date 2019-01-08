import {Schema} from 'mongoose';

export const branchSchema = {
  name: {
    type: Schema.Types.String,
    required: true,
  },
  type: {
    type: Schema.Types.String,
    required: false,
  },
  desc: {
    type: Schema.Types.String,
    required: false,
  },
  root: {
    type: Schema.Types.Boolean,
    required: false,
  },
  childBranches: {
    type: [Schema.Types.ObjectId],
    default: [],
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
    country: {
      type: Schema.Types.String,
    },
    locationDesc: {
      type: Schema.Types.String,
    },
    location: {
      type: {
        latitude: {
          type: Schema.Types.String,
          required: true,
        },
        longitude: {
          type: Schema.Types.String,
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
        type: Schema.Types.Boolean,
        default: false,
        required: true,
      },
      responsibleForDelivery: {
        type: Schema.Types.Boolean,
        default: false,
        required: false,
      },
      partlyPaymentPeriods: {
        type: [
          {
            type: Schema.Types.String,
            date: Schema.Types.Date,
            percentageBuyout: Schema.Types.Number,
            percentageBuyoutUsed: Schema.Types.Number,
            percentageUpFront: Schema.Types.Number,
            percentageUpFrontUsed: Schema.Types.Number,
          },
        ],
        default: [],
      },
      rentPeriods: {
        type: [
          {
            type: Schema.Types.String,
            maxNumberOfPeriods: Schema.Types.Number,
            date: Schema.Types.Date,
            percentage: Schema.Types.Number,
          },
        ],
        default: [],
      },
      extendPeriods: {
        type: [
          {
            type: Schema.Types.String,
            maxNumberOfPeriods: Schema.Types.Number,
            price: Schema.Types.Number,
            date: Schema.Types.Date,
            percentage: {
              type: Schema.Types.Number,
              required: false,
            },
          },
        ],
        default: [],
      },
      buyout: {
        type: {
          percentage: Schema.Types.Number,
        },
        default: 1,
      },
      sell: {
        type: {
          percentage: Schema.Types.Number,
        },
        default: 1,
      },
      acceptedMethods: {
        type: [Schema.Types.String],
        default: [],
      },
      payLater: {
        type: Schema.Types.Boolean,
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
      type: Schema.Types.Boolean,
      default: true,
    },
    byMail: {
      type: Schema.Types.Boolean,
      default: true,
    },
  },
  isBranchItemsLive: {
    type: {
      online: Schema.Types.Boolean,
      atBranch: Schema.Types.Boolean,
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
};
