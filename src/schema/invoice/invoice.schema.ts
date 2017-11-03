
import {Schema} from "mongoose";

export const InvoiceSchema = {
	amount: {
		type: Schema.Types.Number,
		required: true
	},
	fee: {
		type: Schema.Types.Number,
		required: true
	},
	deadline: {
		type: Schema.Types.Date,
		required: true
	},
	user: {
		type: Schema.Types.ObjectId,
		required: true
	},
	invoiceItems: {
		type: [Schema.Types.ObjectId],
		required: true
	}
};
