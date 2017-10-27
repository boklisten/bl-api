
import {Schema} from 'mongoose';

export let UserSchema = {
	userDetail: {
		type: Schema.Types.ObjectId
	},
	permission: {
		type: Schema.Types.String,
		required: true
	},
	login: {
		type: {
			provider: {
				type: Schema.Types.String,
				required: true
			},
			providerId: {
				type: Schema.Types.String,
				required: true
			},
		},
		required: true
	},
	blid: {
		type: Schema.Types.String,
		required: true
	},
	username: {
		type: Schema.Types.String,
		required: true
	},
	active: {
		type: Schema.Types.Boolean,
		default: true
	},
	lastActive: {
		type: Schema.Types.Date,
		default: new Date()
	},
	lastRequest: {
		type: Schema.Types.String
	}
};
