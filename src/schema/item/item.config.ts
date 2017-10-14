


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
                    method: 'get'
                },
                {
                    method: 'post'
                }
            ]
        },
        {
            path: 'items',
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
        {fieldName: 'title', type: 'string'},
        {fieldName: 'desc', type: 'string'}
	]
}
