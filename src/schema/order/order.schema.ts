

import {Schema} from 'mongoose';

export let OrderSchema = {
	employee: {
		type: Schema.Types.ObjectId
	},
	customer: {
		type: Schema.Types.ObjectId
	},
	amount: {
		type: Schema.Types.Number,
		required: true
	},
	application: {
		type: Schema.Types.String,
		required: true
	},
	byCustomer: {
		type: Schema.Types.Boolean,
		required: true
	},
	branch: {
		type: Schema.Types.ObjectId,
		required: true
	},
	orderItems: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	payments: {
		type: [
			{
				method: {
					type: Schema.Types.String,
					required: true
				},
				amount: {
					type: Schema.Types.Number,
					required: true
				},
				confirmed: {
					type: Schema.Types.Boolean,
					required: true
				},
				byBranch: {
					type: Schema.Types.Boolean,
					required: true
				},
				branch: {
					type: Schema.Types.ObjectId
				},
				time: {
					type: Schema.Types.Date,
					required: true
				}
			}
		],
		required: true
	},
	user: {
		type: {
			blid: {
				type: Schema.Types.String
			}
		},
		required: true
	}
};
