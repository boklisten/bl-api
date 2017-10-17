
import {Schema} from 'mongoose';

export let UserSchema = {
	userType: {
		type: Schema.Types.String,
		required: true
	},
	userDetail: {
		type: Schema.Types.ObjectId
	},
	permissionLevel: {
		type: Schema.Types.Number,
		default: 1
	},
	lastActive: {
		type: Schema.Types.Date,
		default: new Date()
	},
	lastRequest: {
		type: Schema.Types.String
	},
	active: {
		type: Schema.Types.Boolean,
		default: true
	},
	token: {
		type: Schema.Types.String
	},
	emailToken: {
		type: Schema.Types.String,
		required: true
	}
};
