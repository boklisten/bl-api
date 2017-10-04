

import * as express from 'express';
import {MongoHandler} from "../db/mongoHandler";
import {Endpoint} from "./endpoint";

export type EndpointConfig = {
    basePath: string
}

export class EndpointExpress {
    router: express.Router;
    config: EndpointConfig;
    mongoHandler: MongoHandler;
    endpoint: Endpoint;

    constructor(router: express.Router, config: EndpointConfig, mongoHandler: MongoHandler, endpoint: Endpoint) {
        this.router = router;
        this.config = config;
        this.mongoHandler = mongoHandler;
        this.endpoint = endpoint;
    }
}
