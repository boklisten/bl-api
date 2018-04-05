

import {BlCollection, BlEndpoint} from "../bl-collection";
import {orderSchema} from "./order.schema";
import {OrderValidator} from "./helpers/order-validator/order-validator";
import {Schema} from "mongoose";
import {OrderPatchHook} from "./hooks/order.patch.hook";
import {OrderPostHook} from "./hooks/order.post.hook";

export class OrderCollection implements BlCollection {
	collectionName = 'orders';
	mongooseSchema = orderSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'post',
			hook: new OrderPostHook(),
			restriction: {
				permissions: ["customer", "employee", "admin"],
				restricted: true
			}
		},
		{
			method: 'patch',
			hook: new OrderPatchHook(),
			restriction: {
				permissions: ["customer", "employee", "admin"],
				restricted: true
			}
		},
		{
			method: 'getId',
			restriction: {
				permissions: ["customer", "employee", "admin"],
				restricted: true
			}
		}
	]
}