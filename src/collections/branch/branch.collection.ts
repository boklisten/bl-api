

import {BlCollection, BlEndpoint} from "../bl-collection";
import {branchSchema} from "./branch.schema";
import {Schema} from "mongoose";
import {BranchPostHook} from "./hook/branch-post.hook";

export class BranchCollection implements BlCollection {
	collectionName = 'branches';
	mongooseSchema = branchSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getAll'
		},
		{
      method: 'getId'
		},
		{
			method: 'post',
			hook: new BranchPostHook(),
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
