


import {BlCollection, BlEndpoint} from "../bl-collection";
import {deliverySchema} from "./delivery.schema";
import {Schema} from "mongoose";
import {DeliveryPostHook} from "./hooks/delivery.post.hook";
import {DeliveryPatchHook} from "./hooks/delivery.patch.hook";

export class DeliveryCollection implements BlCollection {
	
	public collectionName = 'deliveries';
	public mongooseSchema = deliverySchema;
	public endpoints: BlEndpoint[] = [
		{
			method: 'post',
			hook: new DeliveryPostHook(),
			restriction: {
				permissions: ['customer', 'employee', "admin"]
			}
		},
		{
			method: 'getAll',
			restriction: {
				permissions: ['admin'],
				restricted: true
			}
		},
		{
			method: 'getId',
			restriction: {
				permissions: ['customer', 'employee', 'admin'],
				restricted: true
			}
		},
		{
			method: 'patch',
			hook: new DeliveryPatchHook(),
			restriction: {
				permissions: ['customer', "employee", "admin"],
				restricted: true
			}
		},
		{
			method: 'delete',
			restriction: {
				permissions: ['admin']
			}
		}
	]
	
	
}