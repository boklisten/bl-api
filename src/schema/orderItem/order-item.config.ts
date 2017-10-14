


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
        {fieldName: 'type', type: 'string'},
        {fieldName: 'amount', type: 'number'}
	]
}
