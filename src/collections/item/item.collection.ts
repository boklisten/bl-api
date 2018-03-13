

import {BlCollection, BlEndpoint} from "../bl-collection";
import {itemSchema} from "./item.schema";
import {Schema} from "mongoose";

export class ItemCollection implements BlCollection {
	collectionName = 'items';
	mongooseSchema = itemSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getAll'
		},
		{
			method: 'getId'
		}
	]
}