


import {SESchemaConfig} from "../../config/schema/se.schema.config";
import {Schema} from 'mongoose';

export class CustomerSchemaConfig implements SESchemaConfig {
	name = 'customer';
	permissionLevel = 0;
	values = [
		{
			name: 'name',
			type: Schema.Types.String,
			required: true
		},
		{
			name: 'phone',
			type: Schema.Types.Number,
			required: true
		},
		{
			name: 'address',
			type: Schema.Types.String,
			required: true
		},
		{
			name: 'postCode',
			type: Schema.Types.String,
			required: true
		},
		{
			name: 'postCity',
			type: Schema.Types.String,
			required: true
		},
		{
			name: 'country',
			type: Schema.Types.String,
			required: true
		},
		{
			name: 'email',
			type: Schema.Types.String,
			required: true
		},
		{
			name: 'emailConfirmed',
			type: Schema.Types.String,
			required: true
		},
		{
			name: 'dob',
			type: Schema.Types.Date,
			required: true
		},
		{
			name: 'branch',
			type: Schema.Types.ObjectId,
			required: true
		},
		{
			name: 'lastActive',
			type: Schema.Types.Date,
			required: false
		},
		{
			name: 'guardianName',
			type: Schema.Types.String,
			required: false
		},
		{
			name: 'guardianEmail',
			type: Schema.Types.String,
			required: false
		},
		{
			name: 'guardianEmailConfirmed',
			type: Schema.Types.Boolean,
			required: false
		},
		{
			name: 'guardianPhone',
			type: Schema.Types.Number,
			required: false
		},
		{
			name: 'guardianConfirmed',
			type: Schema.Types.Boolean,
			required: false
		}
	]
}
