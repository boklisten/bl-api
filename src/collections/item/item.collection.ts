

import {BlCollection, BlEndpoint} from "../bl-collection";
import {itemSchema} from "./item.schema";
import {Schema} from "mongoose";

export class ItemCollection implements BlCollection {
	collectionName = 'items';
	mongooseSchema = itemSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getId'
		},
		{
			method: 'getAll',
			validQueryParams: [
				{
					fieldName: 'title',
					type: 'string'
				},
				{
					fieldName: 'type',
					type: "string"
				},
				{
					fieldName: 'info',
					type: 'string'
				},
				{
					fieldName: 'info.isbn',
					type: 'string',
				}
			]
		}
	]
}