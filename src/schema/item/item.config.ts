import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {ItemSchema} from "./item.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";

export class ItemConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'items';
	schema: SESchema = new SESchema(this.collectionName, ItemSchema);
	paths: Path[] = [
		{
			path: 'items',
			id: false,
			methods: [
				{
					method: 'get',
					login: false
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
			path: 'items',
			id: true,
			methods: [
				{
					method: 'get',
					login: false
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
		{fieldName: 'title', type: 'string'},
		{fieldName: 'desc', type: 'string'},
		{fieldName: 'price', type: 'number'},
		{fieldName: 'sell', type: "boolean"},
		{fieldName: 'sellPrice', type: "number"},
		{fieldName: 'rent', type: "boolean"},
		{fieldName: 'buy', type: 'boolean'}
	]
}
