

import {Schema} from 'mongoose';


export let OrderItemSchema = {
	order: {
		type: Schema.Types.ObjectId,
		required: true
	},
	item: {
		type: Schema.Types.ObjectId,
		required: true
	},
	type: {
		type: Schema.Types.String
	},
	amount: {
		type: Schema.Types.Number,
		required: true
	},
	customerItem: {
		type: Schema.Types.ObjectId
	}
};
