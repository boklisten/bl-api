

import {Schema} from "mongoose";
import {BlCollection, BlEndpoint} from "../bl-collection";
import {paymentSchema} from "./payment.schema";

export class PaymentCollection implements BlCollection {
	public collectionName = 'testpayments';
	public mongooseSchema = paymentSchema;
	public endpoints: BlEndpoint[] = [
		{
			method: "post",
			restriction: {
				permissions: ["customer", "employee", "admin"]
			}
		},
		{
			method: 'getAll',
			restriction: {
				permissions: ["admin"],
				restricted: true
			}
		},
		{
			method: 'getId',
			restriction: {
				permissions: ["customer", "employee", "admin"],
				restricted: true
			}
		},
		{
			method: "patch",
			restriction: {
				permissions: ["customer", "employee", "admin"],
				restricted: true
			}
		},
		{
			method: "delete",
			restriction: {
				permissions: ["admin"],
				restricted: true
			}
		}
	]
};