import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {OrderSchema} from "./order.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";

export class OrderConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'orders';
	schema: SESchema = new SESchema(this.collectionName, OrderSchema);
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
						permissions: ["customer", "employee", "admin"]
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
						permissions: ["employee", "admin"],
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
		{fieldName: 'amount', type: 'number'},
		{fieldName: 'application', type: 'string'},
		{fieldName: 'byCustomer', type: 'boolean'}
	];
}
