

import {Schema} from "mongoose";
import {BlCollection, BlEndpoint} from "../bl-collection";
import {paymentSchema} from "./payment.schema";

export class PaymentCollection implements BlCollection {
	public collectionName = 'testpayments';
	public mongooseSchema = paymentSchema;
	public endpoints: BlEndpoint[] = [
		{
			method: 'get',
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
			method: "post",
			restriction: {
				permissions: ["customer", "employee", "admin"]
			}
		},
		{
			method: "patch",
			restriction: {
				permissions: ["customer", "employee", "admin"],
				restricted: true
			}
		}
	]
};