import {BlCollection, BlEndpoint} from "../bl-collection";
import {branchItemSchema} from "./branch-item.schema";
import { Schema} from "mongoose";

export class BranchItemCollection implements BlCollection {
	collectionName = 'branchitems';
	mongooseSchema = branchItemSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getId'
		},
		{
			method: 'post',
			restriction: {
				permissions: ['admin', 'super']
			}
		},
		{
			method: 'patch',
			restriction: {
				permissions: ['admin', 'super']
			}
		}
	];
}