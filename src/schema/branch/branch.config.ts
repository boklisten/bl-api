
import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {SESchema} from "../../config/schema/se.schema";
import {BranchSchema} from "./branch.schema";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";

export class BranchConfig implements EndpointConfig {
	basePath = 'api';
	collectionName = 'branches';
	schema = new SESchema('branch', BranchSchema);
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
	validSearchParams: ValidParam[] = [
		{fieldName: 'name', type: "string"},
		{fieldName: 'type', type: "string"},
		{fieldName: 'desc', type: "string"},
		{fieldName: 'root', type: "boolean"}
	]
}
