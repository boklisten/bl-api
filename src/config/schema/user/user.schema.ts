
import {Schema} from 'mongoose';

export let UserSchema = {
	userDetail: {
		type: Schema.Types.ObjectId
	},
	permissionLevel: {
		type: Schema.Types.Number,
		default: 1
	},
	login: {
		provider: {
			type: Schema.Types.String,
			required: true
		},
		providerId: {
			type: Schema.Types.String
		}
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
