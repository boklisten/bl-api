

import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {CustomerItemSchema} from "./customer-item.schema";

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
    validSearchParams: string[] = [
        'comments*'
    ]
}
