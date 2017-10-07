


import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {ItemSchema} from "./item.schema";

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
    validSearchParams: string[] = [
    	'title',
		'type',
		'info*',
		'desc'
	]
}
