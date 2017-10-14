

import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {CustomerItemSchema} from "./customer-item.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";

export class CustomerItemConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'customerItems';
	schema: SESchema = new SESchema('customerItem', CustomerItemSchema);
	paths: Path[] = [
		{
            path: this.collectionName,
            id: false,
            methods: [
                {
                    method: 'get'
                },
                {
                    method: 'post'
                }
            ]
        },
        {
            path: this.collectionName,
            id: true,
            methods: [
                {
                    method: 'get'
                },
                {
                    method: 'patch'
                },
                {
                    method: 'put'
                },
                {
                    method: 'delete'
                }
            ]
        }
	];
    validSearchParams: ValidParam[] = [
        {fieldName: 'state', type: 'string'},
        {fieldName: 'handout', type: "boolean"},
        {fieldName: 'returned', type: 'boolean'},
        {fieldName: 'totalAmount', type: 'number'}
    ]
}
