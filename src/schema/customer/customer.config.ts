

import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {CustomerSchema} from "./customer.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";

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
	validSearchParams: ValidParam[] = [
		{fieldName: 'name', type: "string"},
		{fieldName: 'phone', type: "number"},
		{fieldName: 'address', type: "string"},
		{fieldName: 'postCode', type: "string"},
		{fieldName: 'postCity', type: "string"},
		{fieldName: 'country', type: "string"},
		{fieldName: 'email', type: "string"},
		{fieldName: 'emailConfirmed', type: "boolean"},
		{fieldName: 'guardianName', type: "string"},
		{fieldName: 'guardianEmail', type: "string"},
		{fieldName: 'guardianEmailConfirmed', type: "boolean"},
		{fieldName: 'guardianPhone', type: "number"},
		{fieldName: 'guardianConfirmed', type: "boolean"}
	]
}
