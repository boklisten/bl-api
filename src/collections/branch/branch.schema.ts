
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
				required: true
			},
			rentPeriods: [{
				type: Schema.Types.String,
				maxNumberOfPeriods: Schema.Types.Number,
				percentage: Schema.Types.Number
			}],
			extendPeriods: [{
				type: Schema.Types.String,
				maxNumberOfPeriods: Schema.Types.Number,
				price: Schema.Types.Number,
				percentage: {
					type: Schema.Types.Number,
					required: false
				}
			}]
		},
		required: true
	},
	items: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	inventory: {
		type: [{
			item: Schema.Types.ObjectId,
			sharedItems: [Schema.Types.ObjectId]
		}],
		default: []
	},
	itemCategories: {
		type: [{
			name: Schema.Types.String,
			items: [Schema.Types.ObjectId]
		}],
		default: []
	},
	openingHours: {
		type: [Schema.Types.ObjectId],
		default: []
	}
};