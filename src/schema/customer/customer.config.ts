

import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {CustomerSchema} from "./customer.schema";

export class CustomerConfig implements EndpointConfig {
	basePath = 'api';
	collectionName = 'customers';
	schema: SESchema = new SESchema('customer', CustomerSchema);
	paths: Path[] = [
		{
			path: 'customers',
			id: false,
			methods: [
				{
					method: "get"
				},
				{
					method: "post"
				}
			]
		},
		{
			path: 'customers',
			id: true,
			methods: [
				{
					method: "get"
				},
				{
					method: "patch"
				},
				{
					method: "delete"
				},
				{
					method: "put"
				}
			]
		}
	];
	validSearchParams: string[] = [
		'name',
		'address',
		'postCode',
		'postCity',
		'country',
		'email',
		'guardianName',
		'guardianEmail'
	]
}
