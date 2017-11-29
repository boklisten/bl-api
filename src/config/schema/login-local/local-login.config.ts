

import {EndpointConfig, Path} from "../../../endpoint/endpoint.express";
import {SESchema} from "../se.schema";
import {LocalLoginSchema} from "./local-login.schema";
import {ValidParam} from "../../../query/valid-param/db-query-valid-params";


export class LocalLoginConfig implements EndpointConfig {
	basePath: string = 'api';
	collectionName: string = 'localLogins';
	schema: SESchema = new SESchema(this.collectionName, LocalLoginSchema);
	paths: Path[] = [];

	validSearchParams: ValidParam[] = [];
	
	constructor() {
	
	}
}