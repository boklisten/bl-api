

import {BlCollection, BlEndpoint} from "../bl-collection";
import {userDetailSchema} from "./user-detail.schema";

export class UserDetailCollection implements BlCollection {
	collectionName = 'userdetails';
	mongooseSchema = userDetailSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getId',
			restriction: {
				permissions: ['customer', "employee", "admin"],
				restricted: true
			}
		},
		{
			method: 'patch',
			restriction: {
				permissions: ['customer', 'employee', "admin"]
			}
		}
	]
}