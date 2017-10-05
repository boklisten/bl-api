

import * as express from 'express';
import {SESchema} from "../config/schema/se.schema";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEDocument} from "../db/model/se.document";



export type EndpointConfig = {
    basePath: string,
    collectionName: string,
    schema: SESchema,
    paths: Path[]
}

export type Path = {
    path: string,
    id: boolean,
    methods: {
        method: "get" | "post" | "put" | "patch" | "delete",
        permissionLevel?: number
    }[];
}

export class EndpointExpress {
    router: express.Router;
    config: EndpointConfig;
    basePath: string;
    endpointMongoDb: EndpointMongodb;

    constructor(router: express.Router, config: EndpointConfig) {
        this.router = router;
        this.config = config;
        this.basePath = config.basePath;
        this.endpointMongoDb = new EndpointMongodb(config.schema);

        if (!this.createEndpoints(router, config)) {
            console.log('could not create endpoints for ', config.basePath);
            return;
        }
        console.log('made endpoints for ', config.basePath);

    }

    createEndpoints(router: express.Router, config: EndpointConfig) {
        if (!this.validateConfig(config)) return;

        for (let path of config.paths) {
            for (let method of path.methods) {

                switch (method.method) {
                    case "get": this.createGet(router, path);
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

    createGet(router: express.Router, path: Path) {
		if (!path.id) {
			router.get(this.createPath(path.path), (req: express.Request, res: express.Response) => {
				this.endpointMongoDb.get(this.generateFilter(req.query)).then(
					(docs: SEDocument[]) => {
					   res.send(docs);
					},
					(error) => {
						console.log('something went wrong', error);
					   res.send(error);
					});
				});
		} else {
			router.get(this.createPath(path.path, true), (req: express.Request, res: express.Response) => {
				this.endpointMongoDb.getById(req.params.id).then(
					(doc: SEDocument) => {
						res.send(doc);
					},
					(error) => {
						res.send(error);
					}
				)

			});
		}

    }

    createDelete(router: express.Router, path: Path) {
    	router.delete(this.createPath(path.path, true), (req: express.Request, res: express.Response) => {
    		this.endpointMongoDb.deleteById(req.params.id).then(
				(doc: SEDocument) => {
					res.send(doc);
				},
				(error) => {
					res.send(error);
				});
		});
	}

    createPost(router: express.Router, path: Path) {
        router.post(this.createPath(path.path), (req: express.Request, res: express.Response) => {
            this.endpointMongoDb.post(new SEDocument('item', req.body)).then(
                (doc: SEDocument) => {
                   res.send(doc);
                },
                (error) => {
                    console.log('something went wrong', error);
                   res.send(error);
                });
        });
    }

    createPatch(router: express.Router, path: Path) {
    	router.patch(this.createPath(path.path, true), (req: express.Request, res: express.Response) => {
    		console.log('PATCH', req.body);

    		this.endpointMongoDb.patch(req.params.id, req.body).then(
				(doc: SEDocument) => {
					res.send(doc);
				},
				(error) => {
					res.send(error);
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

    generateFilter(query: any) {

    	console.log('the query', query);
        if (query.title) {
            console.log('the regex: ',  new RegExp(query.title, 'i'));
            return { title: { $regex: new RegExp(query.title), $options: 'imx'}};

        }
        return query;
    }
}
