

import {EndpointConfig, Path} from "../../../endpoint/endpoint.express";
import {SESchema} from "../se.schema";
import {UserDetailSchema} from "./user-detail.schema";
import {ValidParam} from "../../../query/valid-param/db-query-valid-params";

export class UserDetailConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'userDetails';
	schema: SESchema = new SESchema(this.collectionName, UserDetailSchema);
	paths: Path[] = [
        {
            path: this.collectionName,
            id: true,
            methods: [
                {
                    method: 'patch',
	                login: true,
	                loginOptions: {
                    	permissions: ["customer", "employee", "admin"],
		                restrictedToUserOrAbove: true
	                }
                },
				{
					method: 'get',
					login: true,
					loginOptions: {
						permissions: ["customer", "employee", "admin"],
						restrictedToUserOrAbove: true
					}
				}
            ]
        }
    ];
    validSearchParams: ValidParam[] = []
}