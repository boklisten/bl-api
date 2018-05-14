import {BlCollection, BlEndpoint} from "../bl-collection";
import {blErrorLogSchema} from "./bl-error-log.schema";

import {Schema} from "mongoose";

export class BlErrorLogCollection implements BlCollection {
	collectionName = 'blerrorlogs';
	mongooseSchema = blErrorLogSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getAll',
			validQueryParams: [
				{
					fieldName: 'msg',
					type: 'string'
				},
				{
					fieldName: 'code',
					type: 'number'
				}
			]
		}
	]
}