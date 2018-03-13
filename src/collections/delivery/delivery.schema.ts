

import {Schema} from "mongoose";

export const deliverySchema = {
	
	method: {
		type: Schema.Types.String,
		required: true
	},
	info: {
		type: Schema.Types.Mixed,
		required: true
	},
	order: {
		type: Schema.Types.ObjectId,
		required: true
	},
	amount: {
		type: Schema.Types.Number,
		required: true
	}
};