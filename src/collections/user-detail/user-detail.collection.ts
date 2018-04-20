

import {BlCollection, BlEndpoint} from "../bl-collection";
import {userDetailSchema} from "./user-detail.schema";
import {Schema} from "mongoose";

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
		},
		{
			method: 'getAll',
			validQueryParams: [
				{
					fieldName: 'email',
					type: 'string'
				},
				{
					fieldName: 'name',
					type: "string"
				},
				{
					fieldName: 'phone',
					type: 'string'
				},
				{
					fieldName: 'address',
					type: 'string'
				},
				{
					fieldName: 'postCity',
					type: 'string'
				},
				{
					fieldName: 'postCode',
					type: 'string'
				}
			],
			restriction: {
				permissions: ['employee', 'admin']
			}
		}
	]
}