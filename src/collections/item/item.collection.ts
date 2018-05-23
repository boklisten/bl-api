

import {BlCollection, BlEndpoint} from "../bl-collection";
import {itemSchema} from "./item.schema";
import {Schema} from "mongoose";
import {ItemPostHook} from "./hook/item-post.hook";

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
		},
		{
			method: 'post',
			hook: new ItemPostHook(),
			restriction: {
				permissions: ['admin']
			}
		}
	]
}