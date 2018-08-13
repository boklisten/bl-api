

import {BlCollection, BlDocumentPermission, BlEndpoint} from "../bl-collection";
import {orderSchema} from "./order.schema";
import {OrderValidator} from "./helpers/order-validator/order-validator";
import {Schema} from "mongoose";
import {OrderPatchHook} from "./hooks/order.patch.hook";
import {OrderPostHook} from "./hooks/order.post.hook";

export class OrderCollection implements BlCollection {
	collectionName = 'orders';
	mongooseSchema = orderSchema;
	documentPermission: BlDocumentPermission = {
		viewableForPermission: "employee"
	};
	endpoints: BlEndpoint[] = [
		{
			method: 'post',
			hook: new OrderPostHook(),
			restriction: {
				permissions: ["customer", "employee", "manager", "admin", "super"],
				restricted: true
			}
		},
		{
			method: 'patch',
			hook: new OrderPatchHook(),
			restriction: {
				permissions: ["customer", "employee", "manager", "admin", "super"],
				restricted: true
			}
		},
		{
			method: 'getId',
			restriction: {
				permissions: ["customer", "employee", "manager", "admin", "super"],
				restricted: true
			}
		},
		{
			method: 'getAll',
			restriction: {
				permissions: ["manager", "admin", "super"]
			},
			validQueryParams: [
				{
					fieldName: 'name',
					type: 'string'
				},
				{
					fieldName: 'placed',
					type: 'boolean'
				},
				{
					fieldName: 'byCustomer',
					type: 'boolean'
				},
				{
					fieldName: 'branch',
					type: 'string'
				}
			]
		}
	]
}