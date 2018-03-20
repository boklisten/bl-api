
import {Schema} from "mongoose";

export const paymentSchema = {
	method: {
		type: Schema.Types.String,
		required: true
	},
	order: {
		type: Schema.Types.ObjectId,
		required: true
	},
	amount: {
		type: Schema.Types.Number,
		required: true
	},
	customer: {
		type: Schema.Types.ObjectId,
		required: true
	},
	branch: {
		type: Schema.Types.ObjectId,
		required: true
	},
	taxAmount: {
		type: Schema.Types.Number,
		required: true
	},
	info: {
		type: Schema.Types.Mixed,
		required: true
	},
	confirmed: {
		type: Schema.Types.Boolean,
		default: false
	},
	discount: {
		amount: {
			type: Schema.Types.Number,
			required: true
		},
		coupon: Schema.Types.String
	}
};