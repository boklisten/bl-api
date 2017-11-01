

import {Schema} from "mongoose";

export const InvoiceItemSchema = {
	item: {
		type: Schema.Types.ObjectId,
		required: true
	},
	customerItem: {
		type: Schema.Types.ObjectId,
		required: true
	},
	user: {
		type: Schema.Types.ObjectId,
		required: true
	},
	amount: {
		type: Schema.Types.Number,
		required: true
	},
	deadline: {
		type: Schema.Types.Date,
		required: true
	},
	invoice: {
		type: Schema.Types.ObjectId,
		required: true
	}
};