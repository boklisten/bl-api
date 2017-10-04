
import * as express from 'express';
import {EndpointConfig, EndpointExpress} from "../endpoint.express";
import {ItemEndpoint} from "./item.endpoint";
import {MongoHandler} from "../../db/mongoHandler";

export class ItemExpress extends EndpointExpress {

    itemEndpoint: ItemEndpoint;

    constructor(router: express.Router, config: EndpointConfig, mongoHandler: MongoHandler) {
        super(router, config, mongoHandler, new ItemEndpoint(mongoHandler));



    }


}
