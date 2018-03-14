

import {BlCollection, BlEndpoint} from "../bl-collection";
import {branchSchema} from "./branch.schema";
import {Schema} from "mongoose";

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
	];
}