
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
                    method: 'get',
	                login: false
                },
                {
                    method: 'post',
	                login: true,
	                permissions: ["admin"]
                }
            ]
        },
        {
            path: 'branches',
            id: true,
            methods: [
                {
                    method: 'get',
	                login: false
                },
                {
                    method: 'patch',
	                login: true,
	                permissions: ["employee", "admin"]

                },
                {
                    method: 'put',
	                login: true,
	                permissions: ["admin"]
                },
                {
                    method: 'delete',
	                login: true,
	                permissions: ["admin"]
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
