

import {Router, Response, Request} from 'express';
import {SESchema} from "../config/schema/se.schema";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEDocument} from "../db/model/se.document";
import {SEResponseHandler} from "../response/se.response.handler";
import {SEResponse} from "../response/se.response";
import {SEErrorResponse} from "../response/se.error.response";
import {SEDbQueryBuilder} from "../query/se.db-query-builder";
import {ValidParam} from "../query/valid-param/db-query-valid-params";
import {EndpointGetExpress} from "./endpoint-get.express";
import {UserPermission} from "../auth/user/user-permission";
import {User} from "../config/schema/user/user";



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
	loginOptions?: LoginOption
}

export type LoginOption = {
	permissions: UserPermission[],
	restrictedToUserOrAbove?: boolean //for example when request is for a user, only the user itself can update this, or a user with higher permission
	userPermission?: UserPermission //the permission of the user this endpoint is for, for example "userDetail" or "order"
}

export class EndpointExpress {
    router: Router;
    config: EndpointConfig;
    basePath: string;
    endpointMongoDb: EndpointMongodb;
    resHandler: SEResponseHandler;
    seQuery: SEDbQueryBuilder;
    endpointGetExpress: EndpointGetExpress;

    constructor(router: Router, config: EndpointConfig, resHandler: SEResponseHandler) {
        this.router = router;
        this.config = config;
        this.basePath = config.basePath;
        this.endpointMongoDb = new EndpointMongodb(config.schema);
        this.resHandler = resHandler;
        this.seQuery = new SEDbQueryBuilder();
        this.endpointGetExpress = new EndpointGetExpress(resHandler, this.endpointMongoDb);

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
                    case "get": this.endpointGetExpress.createGetEnpoint(router, path, method, url, method.loginOptions, this.config.validSearchParams);
                        break;
                    case "post": this.createPost(router, path);
                        break;
					case "patch": this.createPatch(router, path);
						break;
					case "delete": this.createDelete(router, path);
						break;
                }
            }
        }
        return true;
    }

    private createUrl(path: Path): string {
    	let thePath = '/' + this.basePath + '/' + path.path;
    	if (path.id) {
    		thePath += '/:id';
	    }
	    return thePath;
    }

    createGet(router: Router, path: Path, method: Method) {
		if (!path.id && !method.login) {
			router.get(this.createPath(path.path), (req: Request, res: Response) => {

				try {
					let dbQuery = this.seQuery.getDbQuery(req.query, this.config.validSearchParams);

					this.endpointMongoDb.get(dbQuery).then(
					(docs: SEDocument[]) => {
						this.resHandler.sendResponse(res, new SEResponse(docs));
							},
					(error: SEErrorResponse) => {
								this.resHandler.sendErrorResponse(res, error);
					});

				} catch (error) {
					this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
					return;
				}
			});
		} else {
			let url = this.createPath(path.path);

			if (method.login) {
				router.get(url,)
			}
			router.get(this.createPath(path.path, true), (req: Request, res: Response) => {
				this.endpointMongoDb.getById(req.params.id).then(
					(docs: SEDocument[]) => {
						this.resHandler.sendResponse(res, new SEResponse(docs));
					},
					(error: SEErrorResponse) => {
						this.resHandler.sendErrorResponse(res, error);
					}
				)
			});
		}

    }

    createPublicGet(router: Router, path: Path) {
    	router.get(this.createPath(path.path), (req: Request, res: Response) => {
			try {
				let dbQuery = this.seQuery.getDbQuery(req.query, this.config.validSearchParams);

				this.endpointMongoDb.get(dbQuery).then(
				(docs: SEDocument[]) => {
					this.resHandler.sendResponse(res, new SEResponse(docs));
						},
				(error: SEErrorResponse) => {
							this.resHandler.sendErrorResponse(res, error);
				});

			} catch (error) {
				this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
				return;
			}
		});
    }

    createPublicGetWithId(router: Router, path: Path) {
    	router.get(this.createPath(path.path, true), (req: Request, res: Response) => {
			this.endpointMongoDb.getById(req.params.id).then(
				(docs: SEDocument[]) => {
					this.resHandler.sendResponse(res, new SEResponse(docs));
				},
				(error: SEErrorResponse) => {
					this.resHandler.sendErrorResponse(res, error);
				}
			)
		});
    }

    createDelete(router: Router, path: Path) {
    	router.delete(this.createPath(path.path, true), (req: Request, res: Response) => {
    		this.endpointMongoDb.deleteById(req.params.id).then(
				(doc: SEDocument[]) => {
					res.send(doc);
				},
				(error) => {
					res.send(error);
				});
		});
	}

    createPost(router: Router, path: Path) {
        router.post(this.createPath(path.path), (req: Request, res: Response) => {
            this.endpointMongoDb.post(new SEDocument(this.config.collectionName, req.body)).then(
                (docs: SEDocument[]) => {
            		this.resHandler.sendResponse(res, new SEResponse(docs));
                },
                (error: SEErrorResponse) => {
                	this.resHandler.sendErrorResponse(res, error);
                });
        });
    }

    createPatch(router: Router, path: Path) {
    	router.patch(this.createPath(path.path, true), (req: Request, res: Response) => {
    		this.endpointMongoDb.patch(req.params.id, req.body).then(
				(docs: SEDocument[]) => {
					this.resHandler.sendResponse(res, new SEResponse(docs));
				},
				(error: SEErrorResponse) => {
					this.resHandler.sendErrorResponse(res, error);
				}
			)
		})
	}

    validateConfig(config: EndpointConfig): boolean {
        for (let path of config.paths) {
           for (let method of path.methods) {
               if (path.id && method.method === 'post') return false;
               if (!path.id && ['put', 'patch', 'delete'].indexOf(method.method) > -1) return false;
           }
        }
        return true;
    }

    createPath(path: string, id?: boolean): string {
    	let thePath = '/' + this.basePath + '/' + path;
    	if (id) thePath += '/:id';
        return thePath;
    }
}
