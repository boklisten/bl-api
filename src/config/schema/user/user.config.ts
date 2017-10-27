

import {EndpointConfig, Path} from "../../../endpoint/endpoint.express";
import {SESchema} from "../se.schema";
import {UserSchema} from "./user.schema";
import {ValidParam} from "../../../query/valid-param/db-query-valid-params";

export class UserConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'users';
	schema: SESchema = new SESchema(this.collectionName, UserSchema);
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
                }
            ]
        }
    ];
    validSearchParams: ValidParam[] = []
}
