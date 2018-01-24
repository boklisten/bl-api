import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {OrderSchema} from "./order.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";
import {OrderHook} from "./order.hook";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {ItemSchema} from "../item/item.schema";
import {CustomerItemSchema} from "../customer-item/customer-item.schema";
import {BranchSchema} from "../branch/branch.schema";

export class OrderConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'orders';
	schema: SESchema = new SESchema('order', OrderSchema);
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
					},
					hook: new OrderHook(
						new EndpointMongodb(new SESchema('items', ItemSchema)),
						new EndpointMongodb(new SESchema('customerItems', CustomerItemSchema)),
						new EndpointMongodb(new SESchema('branches', BranchSchema)))
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
