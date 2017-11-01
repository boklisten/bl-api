


import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";
import {SESchema} from "../../config/schema/se.schema";
import {InvoiceSchema} from "./invoice.schema";

export class InvoiceConfig implements EndpointConfig {
	basePath = 'api';
	collectionName = 'invoices';
	schema = new SESchema('invoice', InvoiceSchema);
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
						permissions: ["admin"]
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
		{fieldName: 'amount', type: "number"},
		{fieldName: 'active', type: "boolean"}
	]
}