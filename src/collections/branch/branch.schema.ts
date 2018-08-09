
import { Schema } from 'mongoose';

export const branchSchema = {
	name: {
		type: Schema.Types.String,
		required: true
	},
	type: {
		type: Schema.Types.String,
		required: false
	},
	desc: {
		type: Schema.Types.String,
		required: false
	},
	root: {
		type: Schema.Types.Boolean,
		required: false
	},
	childBranches: {
		type: [Schema.Types.ObjectId],
		default: []
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
			type: Schema.Types.String
		},
		location: {
			type: {
				latitude: {
					type: Schema.Types.String,
					required: true
				},
				longitude: {
					type: Schema.Types.String,
					required: true
				},
			},
			required: false
		},
		required: false
	},
	paymentInfo: {
		type: {
			responsible: {
				type: Schema.Types.Boolean,
				default: false,
				required: true
			},
			responsibleForDelivery: {
				type: Schema.Types.Boolean,
				default: false,
				required: false
			},
			rentPeriods: {
				type: [{
					type: Schema.Types.String,
					maxNumberOfPeriods: Schema.Types.Number,
					date: Schema.Types.Date,
					percentage: Schema.Types.Number
				}],
				default: [],
				required: true
			},
			extendPeriods: {
				type: [{
					type: Schema.Types.String,
					maxNumberOfPeriods: Schema.Types.Number,
					price: Schema.Types.Number,
					date: Schema.Types.Date,
					percentage: {
						type: Schema.Types.Number,
						required: false
					}
				}],
				default: [],
				required: true
			},
			buyout: {
				type: {
					percentage: Schema.Types.Boolean
				},
				default: 1,
				required: true
			},
			acceptedMethods: {
				type: [Schema.Types.String],
				default: [],
				required: true
			},
			payLater: {
				type: Schema.Types.Boolean,
				default: false,
				required: false
			}
		},
		required: true,
		default: {
			responsible: false,
			rentPeriods: [],
			extendPeriods: [],
			buyout: {
				percentage: 1
			},
			acceptedMethods: []
		}
	},
	deliveryMethods: {
		branch: {
			type: Schema.Types.Boolean,
			default: true
		},
		mail: {
			type: Schema.Types.Boolean,
			default: true
		}
	},
	branchItems: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	openingHours: {
		type: [Schema.Types.ObjectId],
		default: []
	}
};