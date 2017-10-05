
import * as express from 'express';
import * as mongoose from 'mongoose';
import {Schema} from 'mongoose';
import {EndpointConfig, EndpointExpress} from "./endpoint/endpoint.express";
import {Application, Router} from "express";
import {SESchema} from "./config/schema/se.schema";
import {SESchemaConfig} from "./config/schema/se.schema.config";
import {ItemConfig} from "./schema/item/item.config";
import {CustomerConfig} from "./schema/customer/customer.config";
import {BranchConfig} from "./schema/branch/branch.config";
import {BranchSchemaConfig} from "./schema/branch/branch.schema.config";
import {BranchSchema} from "./schema/branch/branch.schema";
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

        //let itemConfig = new ItemConfig();
        //let customerConfig =  new CustomerConfig();
        let branchConfig = new BranchConfig();




        this.router = Router();


        //let ItemEndpoint = new EndpointExpress(this.router, itemConfig);
        //let CustomerEndpoint = new EndpointExpress(this.router, customerConfig);
        let BranchEndpoint = new EndpointExpress(this.router, branchConfig);

        this.app.use(this.router);

        this.app.listen(this.port, () => {
            console.log('api running on port: ', this.port);
        });



    }


}

let srv = new Server();