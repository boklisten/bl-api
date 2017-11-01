


import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {InvoiceItemSchema} from "./invoice-item.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";

export class InvoiceItemConfig implements EndpointConfig {
	basePath = 'api';
	collectionName = 'invoiceItems';
	schema = new SESchema('invoiceItem', InvoiceItemSchema);
	paths: Path[] = [
		{
			path: this.collectionName,
			id: false,
			methods: [
				{
					method: 'get',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				},
				{
					method: 'post',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				}
			]
		},
		{
			path: this.collectionName,
			id: true,
			methods: [
				{
					method: 'get',
					login: true,
					loginOptions: {
						permissions: ["customer", "employee", "admin"],
						restrictedToUserOrAbove: true
					}
				},
				{
					method: 'patch',
					login: true,
					loginOptions: {
						permissions: ["employee", "admin"]
					}
				},
				{
					method: 'put',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				},
				{
					method: 'delete',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				}
			]
		}
	];
	validSearchParams: ValidParam[] = [
		{fieldName: 'amount', type: "string"},
	]
}