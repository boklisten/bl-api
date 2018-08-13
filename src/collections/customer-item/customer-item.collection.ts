import {BlCollection, BlDocumentPermission, BlEndpoint} from "../bl-collection";
import {customerItemSchema} from "./customer-item.schema";
import {Schema} from "mongoose";
import {CustomerItemPostHook} from "./hooks/customer-item-post.hook";

export class CustomerItemCollection implements BlCollection {
	collectionName = 'customeritems';
	mongooseSchema = customerItemSchema;
	documentPermission: BlDocumentPermission = {
		viewableForPermission: "employee"
	};
	endpoints: BlEndpoint[] = [
		{
			method: 'getId',
			restriction: {
				permissions: ['customer', "employee", "manager", "admin", "super"],
				restricted: true
			}
		},
		{
			method: 'patch',
			restriction: {
				permissions: ['customer', "employee", "manager", "admin", "super"],
				restricted: true
			}
		},
		{
			method: 'post',
			hook: new CustomerItemPostHook(),
			restriction: {
				permissions: ['employee', "manager", 'admin', "super"]
			}
		}
	]
}