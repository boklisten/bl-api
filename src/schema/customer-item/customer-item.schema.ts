
import {Schema} from 'mongoose';


export let CustomerItemSchema = {
	item: {
		type: Schema.Types.ObjectId,
		required: true
	},
	user: {
		type: {
			id: {
				type: Schema.Types.ObjectId
			}
		},
		required: true
	},
	deadline: {
		type: Schema.Types.Date,
		required: true
	},
	state: {
		type: Schema.Types.String
	},
	handout: {
		type: Schema.Types.Boolean,
		required: true
	},
	handoutTime: {
		type: Schema.Types.Date
	},
	handoutBranch: {
		type: Schema.Types.ObjectId
	},
	handoutEmployee: {
		type: Schema.Types.ObjectId
	},
	returned: {
		type: Schema.Types.Boolean,
		required: true
	},
	returnTime: {
		type: Schema.Types.Date
	},
	returnBranch: {
		type: Schema.Types.ObjectId
	},
	returnEmployee: {
		type: Schema.Types.ObjectId
	},
	totalAmount: {
		type: Schema.Types.Number,
		required: true
	},
	orderItems: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	deadlineExtends: {
		type: [
			{
				oldDeadline: {
					type: Schema.Types.Date,
					required: true
				},
				newDeadline: {
					type: Schema.Types.Date,
					required: true
				},
				orderItem: {
					type: Schema.Types.ObjectId,
					required: true
				},
				time: {
					type: Schema.Types.Date,
					required: true
				}
			}
		],
		default: []
	},
	comments: {
		type: [
			{
				comment: {
					type: Schema.Types.String,
					required: true
				},
				employee: {
					type: Schema.Types.ObjectId,
					required: true
				},
				time: {
					type: Schema.Types.Date,
					required: true
				}
			}
		],
		default: []
	}
};
