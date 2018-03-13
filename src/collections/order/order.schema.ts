
import {Schema} from 'mongoose';

export let orderSchema = {
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
		type: [
			{
				item: {
					type: Schema.Types.ObjectId,
					required: true
				},
				title: {
					type: Schema.Types.String,
					required: true,
				},
				amount: {
					type: Schema.Types.Number,
					required: true
				},
				unitPrice: {
					type: Schema.Types.Number,
					required: true
				},
				taxAmount: {
					type: Schema.Types.Number,
					required: true
				},
				taxRate: {
					type: Schema.Types.Number,
					required: true
				},
				type: {
					type: Schema.Types.String,
					required: true
				},
				customerItem: {
					type: Schema.Types.String
				},
				discount: {
					type: Schema.Types.Number
				},
				rentInfo: {
					oneSemester: {
						type: Schema.Types.Boolean
					},
					twoSemesters: {
						type: Schema.Types.Boolean
					}
				},
				lastOrderItem: {
					type: Schema.Types.Mixed
				}
			}
		],
		default: []
	},
	payments: {
		type: [Schema.Types.String],
		default: []
	},
	user: {
		type: {
			id: {
				type: Schema.Types.String
			}
		},
		required: true
	}
};