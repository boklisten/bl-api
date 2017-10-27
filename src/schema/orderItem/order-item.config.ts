import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {OrderItemSchema} from "./order-item.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";

export class OrderItemConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'orderItems';
	schema: SESchema = new SESchema(this.collectionName, OrderItemSchema);
	paths: Path[] = [
		{
			path: this.collectionName,
			id: false,
			methods: [
				{
					method: 'get',
					login: true,
					permissions: ["customer", "employee", "admin"]
				},
				{
					method: 'post',
                    login: true,
					permissions: ["customer", "employee", "admin"]
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
					permissions: ["customer", "employee", "admin"]
				},
				{
					method: 'patch',
					login: true,
					permissions: ["employee", "admin"]
				},
				{
					method: 'put',
					login: true,
					permissions: ["admin"]
				},
				{
					method: 'delete',
					login: true,
					permissions: ["admin"]
				}
			]
		}
	];
	validSearchParams: ValidParam[] = [
		{fieldName: 'type', type: 'string'},
		{fieldName: 'amount', type: 'number'}
	]
}
