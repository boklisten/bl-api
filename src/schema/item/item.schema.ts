


import {Schema} from 'mongoose';

export let ItemSchema = {
	title: {
		type: Schema.Types.String,
		required: true
	},
	type: {
		type: Schema.Types.String,
		required: true
	},
	info: {
		type: Schema.Types.Mixed,
		required: true
	},
	price: {
		type: Schema.Types.Number,
		required: true
	},
	sell: {
		type: Schema.Types.Boolean,
		required: true
	},
	sellPrice: {
		type: Schema.Types.Number,
		required: true
	},
	rent: {
		type: Schema.Types.Boolean,
		required: true
	},
	buy: {
		type: Schema.Types.Boolean,
		required: true
	}
};
