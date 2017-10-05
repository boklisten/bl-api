
import {Schema} from 'mongoose';

export let CustomerSchema = {
	name: {
		type: Schema.Types.String,
		required: true
	},
	phone: {
		type: Schema.Types.Number,
		required: true
	},
	address: {
		type: Schema.Types.String,
		required: true
	},
	postCode: {
		type: Schema.Types.String,
		required: true
	},
	postCity: {
		type: Schema.Types.String,
		required: true
	},
	country: {
		type: Schema.Types.String,
		required: true
	},
	email: {
		type: Schema.Types.String,
		required: true
	},
	emailConfirmed: {
		type: Schema.Types.Boolean,
		default: false
	},
	dob: {
		type: Schema.Types.Date,
		required: true
	},
	branch: {
		type: Schema.Types.ObjectId,
		required: true
	},
	lastActive: {
		type: Schema.Types.Date,
		default: Date.now()
	},
	guardianName: {
		type: Schema.Types.String
	},
	guardianEmail: {
		type: Schema.Types.String
	},
	guardianEmailConfirmed: {
		type: Schema.Types.Boolean
	},
	guardianPhone: {
		type: Schema.Types.Number
	},
	guardianConfirmed: {
		type: Schema.Types.Boolean
	}


};
