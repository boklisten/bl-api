

import {EndpointConfig, Path} from "../../../endpoint/endpoint.express";
import {SESchema} from "../se.schema";
import {CustomerSchema} from "./customer.schema";
import {ValidParam} from "../../../query/valid-param/db-query-valid-params";

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
		{fieldName: 'guardian.name', type: "string"},
		{fieldName: 'guardian.email', type: "string"},
		{fieldName: 'guardian.emailConfirmed', type: "boolean"},
		{fieldName: 'guardian.phone', type: "number"},
		{fieldName: 'guardian.confirmed', type: "boolean"}
	]
}
