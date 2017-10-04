

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
        permissionLevel: number
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
                }

            }
        }
        return true;
    }

    createGet(router: express.Router, path: Path) {
        console.log('created GET', this.basePath + path.path);
        router.get(this.basePath + path.path, (req: express.Request, res: express.Response) => {
            console.log('GET ', this.basePath + path.path);
            this.endpointMongoDb.get({}).then(
                (docs: SEDocument[]) => {
                    console.log('we got some documents! ', docs);
                   res.send(docs);
                },
                (error) => {
                    console.log('something went wrong', error);
                   res.send(error);
                });
        });
    }

    createPost(router: express.Router, path: Path) {
        console.log('created POST', this.basePath + path.path);

        router.post(this.basePath + path.path, (req: express.Request, res: express.Response) => {
            console.log('POST ', this.basePath + path.path, req.body);

            this.endpointMongoDb.post(new SEDocument('item', req.body)).then(
                (doc: SEDocument) => {
                    console.log('we got some documents! ', doc);
                   res.send(doc);
                },
                (error) => {
                    console.log('something went wrong', error);
                   res.send(error);
                });
        });
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
}
