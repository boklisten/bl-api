


import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {OrderSchema} from "./order.schema";

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
    validSearchParams: string[] = [];
}
