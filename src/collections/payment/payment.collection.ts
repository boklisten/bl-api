

import {Schema} from "mongoose";
import {BlCollection, BlDocumentPermission, BlEndpoint} from "../bl-collection";
import {paymentSchema} from "./payment.schema";
import {BlDocument} from "@wizardcoder/bl-model";
import {PaymentPostHook} from "./hooks/payment.post.hook";
import {PaymentPatchHook} from "./hooks/payment.patch.hook";

export class PaymentCollection implements BlCollection {
	public collectionName = 'payments';
	public mongooseSchema = paymentSchema;
	documentPermission: BlDocumentPermission = {
		viewableForPermission: "employee"
	};
	public endpoints: BlEndpoint[] = [
		{
			method: "post",
			hook: new PaymentPostHook(),
			restriction: {
				permissions: ["customer", "employee", "manager", "admin", "super"],
				restricted: true
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
				permissions: ["customer", "employee", "manager", "admin", "super"],
				restricted: true
			}
		},
		{
			method: "patch",
			hook: new PaymentPatchHook(),
			restriction: {
				permissions: ["customer", "employee", "manager", "admin", "super"],
				restricted: true
			}
		},
		{
			method: "delete",
			restriction: {
				permissions: ["admin", "manager"],
				restricted: true
			}
		}
	]
};