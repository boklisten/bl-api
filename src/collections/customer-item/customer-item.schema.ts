import {Schema} from 'mongoose';


export const customerItemSchema = {
	item: {
		type: Schema.Types.ObjectId,
		required: true
	},
	sharedItem: {
		type: Schema.Types.ObjectId,
		required: false
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
		default: false
	},
	handoutInfo: {
		handoutBy: {
			type: Schema.Types.String,
			required: true
		},
		handoutById: {
			type: Schema.Types.ObjectId,
			required: true
		},
		handoutEmployee: Schema.Types.ObjectId,
		time: {
			type: Schema.Types.Date,
		}
	},
	returned: {
		type: Schema.Types.Boolean,
		required: true
	},
	returnInfo: {
		type: {

			returnedTo: {
				type: Schema.Types.String,
				required: true
			},
			returnedToId: {
				type: Schema.Types.ObjectId,
				required: true
			},
			returnEmployee: Schema.Types.ObjectId,
			time: {
				type: Schema.Types.Date,
				required: true
			}
		},
		required: false
	},
	orders: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	periodExtends: {
		type: [{
			from: {
				type: Schema.Types.Date,
				required: true,
			},
			to: {
				type: Schema.Types.Date,
				required: true
			},
			periodType: {
				type: Schema.Types.String,
				required: true
			},
			time: {
				type: Schema.Types.Date,
				required: true
			}
		}],
		default: []
	},
};