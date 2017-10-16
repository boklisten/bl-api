

import {Schema} from 'mongoose';



export let EmployeeSchema = {
	name: {
		type: Schema.Types.String,
		required: true
	},
	phone: {
		type: Schema.Types.String,
		required: true
	},
	email: {
		type: Schema.Types.String,
		required: true
	}
};
