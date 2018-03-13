

import {BlCollection, BlEndpoint} from "../bl-collection";
import {branchSchema} from "./branch.schema";

export class BranchCollection implements BlCollection {
	collectionName = 'branches';
	mongooseSchema = branchSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getAll'
		},
		{
			method: 'getId'
		}
	]
}