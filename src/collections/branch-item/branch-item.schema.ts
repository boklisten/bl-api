import {Schema} from "mongoose";


export const branchItemSchema = {
	branch: {
		type: Schema.Types.ObjectId,
		required: true
	},
	item: {
		type: Schema.Types.ObjectId,
		required: true
	},
	rent: {
		type: Schema.Types.Boolean,
		default: false
	},
	buy: {
		type: Schema.Types.Boolean,
		default: false
	},
	sell: {
		type: Schema.Types.Boolean,
		default: false
	},
	sharedItems: {
		type: [Schema.Types.ObjectId],
		default: []
	}
};