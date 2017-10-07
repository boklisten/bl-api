
import * as express from 'express';
import * as mongoose from 'mongoose';
import {EndpointExpress} from "./endpoint/endpoint.express";
import {Application, Router} from "express";
import {ItemConfig} from "./schema/item/item.config";
import {CustomerConfig} from "./schema/customer/customer.config";
import {BranchConfig} from "./schema/branch/branch.config";
import {SEResponseHandler} from "./response/se.response.handler";
import {CustomerItemConfig} from "./schema/customer-item/customer-item.config";
let bodyParser = require('body-parser');

export class Server {

    public app: Application;
    private router: Router;
    private port: number;


    constructor() {

        this.app = express();
        this.app.use(bodyParser.json());
        this.port = 3000;

        mongoose.connect('mongodb://localhost:27017/bl_test_a', {useMongoClient: true});

        let itemConfig = new ItemConfig();
        let customerConfig =  new CustomerConfig();
        let branchConfig = new BranchConfig();
        let customerItemConfig = new CustomerItemConfig();




        this.router = Router();
        let responseHandler = new SEResponseHandler();


        let ItemEndpoint = new EndpointExpress(this.router, itemConfig, responseHandler);
        let CustomerEndpoint = new EndpointExpress(this.router, customerConfig, responseHandler);
        let BranchEndpoint = new EndpointExpress(this.router, branchConfig, responseHandler);
        let CustomerItemEndpoint = new EndpointExpress(this.router, customerItemConfig, responseHandler);

        this.app.use(this.router);

        this.app.listen(this.port, () => {
            console.log('api running on port: ', this.port);
        });



    }


}

let srv = new Server();