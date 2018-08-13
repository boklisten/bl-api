
import {Schema} from 'mongoose';

export let orderSchema = {
	amount: {
		type: Schema.Types.Number,
		required: true
	},
	orderItems: {
		type: [
			{
				type: {
					type: Schema.Types.String,
					required: true
				},
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
				delivered: {
					type: Schema.Types.Boolean,
					required: false,
					default: false
				},
				taxRate: {
					type: Schema.Types.Number,
					required: true
				},
				taxAmount: {
					type: Schema.Types.Number,
					required: true
				},
				customerItem: {
					type: Schema.Types.ObjectId,
					required: false
				},
				info: {
					type: Schema.Types.Mixed,
					required: false
				},
				handout: {
					type: Schema.Types.Boolean,
					required: false
				},
				movedFromOrder: {
					type: Schema.Types.ObjectId,
					required: false
				},
				movedToOrder: {
					type: Schema.Types.ObjectId,
					required: false

				},
				discount: {
					type: {
						amount: {
							type: Schema.Types.Number,
							required: true
						},
						coupon: {
							type: Schema.Types.String,
							required: true
						}
					},
					required: false
				}
			}
		],
		default: []
	},
	branch: {
		type: Schema.Types.ObjectId,
		required: true
	},
	customer: {
		type: Schema.Types.ObjectId
	},
	byCustomer: {
		type: Schema.Types.Boolean,
		required: true
	},
	employee: {
		type: Schema.Types.ObjectId
	},
	placed: {
		type: Schema.Types.Boolean,
		default: false
	},
	payments: {
		type: [Schema.Types.String],
		default: []
	},
	delivery: {
		type: Schema.Types.ObjectId
	},
	handoutByDelivery: {
		type: Schema.Types.Boolean,
		required: false
	}
};