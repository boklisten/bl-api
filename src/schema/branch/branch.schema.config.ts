
import {SESchemaConfig} from "../../config/schema/se.schema.config";
import {Schema} from 'mongoose';

export class BranchSchemaConfig implements SESchemaConfig {
	name = 'branch';
	permissionLevel = 0;
	values = [
		{
			name: 'name',
			type: Schema.Types.String
		},
		{
			name: 'type',
			type: Schema.Types.String
		},
		{
			name: 'desc',
			type: Schema.Types.String,
			required: false
		},
		{
			name: 'root',
			type: Schema.Types.Boolean
		},
		{
			name: 'childBranches',
			type: Schema.Types.Array
		},
		{
			name: 'items',
			type: Schema.Types.Array
		},
		{
			name: 'payment',
			type: Schema.Types.Mixed
		},
		{
			name: 'contactInfo',
			type: Schema.Types.Mixed
		}
	];
}
