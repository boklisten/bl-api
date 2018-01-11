

import {Router} from 'express';
import {SESchema} from "../config/schema/se.schema";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {ValidParam} from "../query/valid-param/db-query-valid-params";

import {EndpointGetExpress} from "./endpoint-get.express";
import {UserPermission} from "../auth/user/user-permission";
import {EndpointPostExpress} from "./endpoint-post.express";
import {EndpointPatchExpress} from "./endpoint-patch.express";
import {EndpointDeleteExpress} from "./endpoint-delete.express";
import {ApiPath} from "../config/api-path";
import {Hook} from "../hook/hook";



export type EndpointConfig = {
    basePath: string,
    collectionName: string,
    schema: SESchema,
    paths: Path[],
	validSearchParams: ValidParam[];
}

export type Path = {
    path: string,
    id: boolean,
    methods: Method[];
}

export type Method = {
	method: "get" | "post" | "put" | "patch" | "delete",
	login: boolean,
	loginOptions?: LoginOption,
	hook?: Hook
}

export type LoginOption = {
	permissions: UserPermission[],
	restrictedToUserOrAbove?: boolean //for example when request is for a user, only the user itself can update this, or a user with higher permission
	userPermission?: UserPermission //the permission of the user this endpoint is for, for example "userDetail" or "order"
}

export class EndpointExpress {
    config: EndpointConfig;
    basePath: string;
    endpointMongoDb: EndpointMongodb;
    resHandler: SEResponseHandler;
    endpointGetExpress: EndpointGetExpress;
    endpointPostExpress: EndpointPostExpress;
    endpointPatchExpress: EndpointPatchExpress;
    endpointDeleteExpress: EndpointDeleteExpress;
    apiPath: ApiPath;

    constructor(router: Router, config: EndpointConfig, resHandler: SEResponseHandler) {
        this.config = config;
        this.basePath = config.basePath;
        this.endpointMongoDb = new EndpointMongodb(config.schema);
        this.resHandler = resHandler;
        this.endpointGetExpress = new EndpointGetExpress(resHandler, this.endpointMongoDb);
        this.endpointPostExpress = new EndpointPostExpress(resHandler, this.endpointMongoDb);
        this.endpointPatchExpress = new EndpointPatchExpress(resHandler, this.endpointMongoDb);
        this.endpointDeleteExpress = new EndpointDeleteExpress(resHandler, this.endpointMongoDb);
        this.apiPath = new ApiPath();

        if (!this.createEndpoints(router, config)) {
            console.log('could not create endpoints for ', config.basePath);
            return;
        }
    }

    createEndpoints(router: Router, config: EndpointConfig) {
        if (!this.validateConfig(config)) return;

        for (let path of config.paths) {
            for (let method of path.methods) {

            	let url = this.createUrl(path);

                switch (method.method) {
                    case "get": this.endpointGetExpress.createGetEndpoint(router, path, method, url, this.config.validSearchParams);
                        break;
                    case "post": this.endpointPostExpress.createPostEndpoint(router, method, url, this.config.collectionName);
                        break;
					case "patch": this.endpointPatchExpress.createPatchEndpoint(router, method, url);
						break;
					case "delete": this.endpointDeleteExpress.createDeleteEndpoint(router, method, url);
						break;
                }
            }
        }
        return true;
    }

    private createUrl(path: Path): string {
    	let thePath = this.apiPath.createPath(path.path);
    	if (path.id) {
    		thePath += '/:id';
	    }
	    return thePath;
    }

    private validateConfig(config: EndpointConfig): boolean {
        for (let path of config.paths) {
           for (let method of path.methods) {
               if (path.id && method.method === 'post') return false;
               if (!path.id && ['put', 'patch', 'delete'].indexOf(method.method) > -1) return false;
           }
        }
        return true;
    }
}
