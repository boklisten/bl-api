
import { Schema } from 'mongoose';

export let branchSchema = {
	name: {
		type: Schema.Types.String,
		required: true
	},
	type: {
		type: Schema.Types.String,
		required: true
	},
	desc: {
		type: Schema.Types.String,
		required: true
	},
	root: {
		type: Schema.Types.Boolean,
		required: true
	},
	childBranches: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	items: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	payment: {
		branchResponsible: {
			type: Schema.Types.Boolean,
			required: true
		},
		rentPricePercentage: {
			base: {
				type: Schema.Types.Number,
				required: true
			},
			oneSemester: {
				type: Schema.Types.Number,
				required: true
			},
			twoSemesters: {
				type: Schema.Types.Number,
				required: true
			},
			buyOut: {
				type: Schema.Types.Number,
				required: true
			}
		},
		extendPrice: {
			type: Schema.Types.Number
		},
		acceptedMethods: {
			type: [Schema.Types.String],
			default: []
		}
	},
	contactInfo: {
		phone: {
			type: Schema.Types.String,
			required: true
		},
		email: {
			type: Schema.Types.String,
			required: true
		},
		address: {
			type: Schema.Types.String,
			required: true
		},
		postCode: {
			type: Schema.Types.String,
			required: true
		},
		postCity: {
			type: Schema.Types.String,
			required: true
		},
		country: {
			type: Schema.Types.String,
			required: true
		}
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