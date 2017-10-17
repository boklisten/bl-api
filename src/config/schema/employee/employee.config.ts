

import {EndpointConfig, Path} from "../../../endpoint/endpoint.express";
import {SESchema} from "../se.schema";
import {EmployeeSchema} from "./employee.schema";
import {ValidParam} from "../../../query/valid-param/db-query-valid-params";

export class EmployeeConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'employees';
	schema: SESchema = new SESchema(this.collectionName, EmployeeSchema);
	paths: Path[] = [
        {
            path: this.collectionName,
            id: true,
            methods: [
                {
                    method: 'get'
                },
                {
                    method: 'patch'
                }
            ]
        }
    ];
    validSearchParams: ValidParam[] = []
}
