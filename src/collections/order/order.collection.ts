

import {BlCollection, BlEndpoint} from "../bl-collection";
import {orderSchema} from "./order.schema";
import {OrderHook} from "./hooks/order.hook";
import {OrderValidator} from "./hooks/order-validator/order-validator";
import {Schema} from "mongoose";

export class OrderCollection implements BlCollection {
	collectionName = 'orders';
	mongooseSchema = orderSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'post',
			hook: new OrderHook(),
			restriction: {
				permissions: ["customer", "employee", "admin"],
				restricted: true
			}
		},
		{
			method: 'patch',
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