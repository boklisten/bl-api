
import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {BranchSchemaConfig} from "./branch.schema.config";
import {BranchSchema} from "./branch.schema";

export class BranchConfig implements EndpointConfig {
	basePath = 'api';
	collectionName = 'branches';
	schema = new SESchema(new BranchSchemaConfig(), BranchSchema);
	paths: Path[] = [
		{
            path: 'branches',
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
            path: 'branches',
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
		'name',
		'type',
		'desc',
		'contactInfo*'
	]
}
