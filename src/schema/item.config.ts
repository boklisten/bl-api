


import {EndpointConfig, Path} from "../endpoint/endpoint.express";
import {SESchema} from "../config/schema/se.schema";
import {ItemSchemaConfig} from "./item.schema.config";

export class ItemConfig implements EndpointConfig {
    basePath: string = 'api';
    collectionName: string = 'items';
    schema: SESchema = new SESchema(new ItemSchemaConfig());
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
    ]
}
