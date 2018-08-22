

import {BlCollection, BlEndpoint} from "../bl-collection";
import {itemSchema} from "./item.schema";
import {Schema} from "mongoose";
import {ItemPostHook} from "./hook/item-post.hook";
import {ItemPatchHook} from "./hook/item-patch.hook";

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
					type: 'number',
				},
				{
					fieldName: 'creationTime',
					type: 'date'
				}
			]
		},
		{
			method: 'post',
			hook: new ItemPostHook(),
			restriction: {
				permissions: ['admin', "super"]
			}
		},
		{
			method: 'patch',
			hook: new ItemPatchHook(),
			restriction: {
				permissions: ['admin', "super"]
			}
		}
	]
}