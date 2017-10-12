
import * as express from 'express';
import * as mongoose from 'mongoose';
import {EndpointExpress} from "./endpoint/endpoint.express";
import {Application, Router} from "express";
import {ItemConfig} from "./schema/item/item.config";
import {CustomerConfig} from "./schema/customer/customer.config";
import {BranchConfig} from "./schema/branch/branch.config";
import {SEResponseHandler} from "./response/se.response.handler";
import {CustomerItemConfig} from "./schema/customer-item/customer-item.config";
import {OrderConfig} from "./schema/order/order.config";
import {OrderItemConfig} from "./schema/orderItem/order-item.config";
let bodyParser = require('body-parser');

export class Server {

    public app: Application;
    private router: Router;
    private port: number;


    constructor() {

        this.app = express();

        this.app.use(bodyParser.json());
        this.port = 3000;

        let cors = require('cors');

        cors({
			'Access-Control-Allow-Origin': 'localhost'
		});
        this.app.use(cors());

        mongoose.connect('mongodb://localhost:27017/bl_test_a', {useMongoClient: true});

        let itemConfig = new ItemConfig();
        let customerConfig =  new CustomerConfig();
        let branchConfig = new BranchConfig();
        let customerItemConfig = new CustomerItemConfig();
        let orderConfig = new OrderConfig();
        let orderItemConfig = new OrderItemConfig();




        this.router = Router();
        let responseHandler = new SEResponseHandler();


        let ItemEndpoint = new EndpointExpress(this.router, itemConfig, responseHandler);
        let CustomerEndpoint = new EndpointExpress(this.router, customerConfig, responseHandler);
        let BranchEndpoint = new EndpointExpress(this.router, branchConfig, responseHandler);
        let CustomerItemEndpoint = new EndpointExpress(this.router, customerItemConfig, responseHandler);
        let OrderEndpoint = new EndpointExpress(this.router, orderConfig, responseHandler);
        let OrderItemEndpoint = new EndpointExpress(this.router, orderItemConfig, responseHandler);

        customerConfig.schema.getValidParamsForType('String');

        this.app.use(this.router);

        this.app.listen(this.port, () => {
            console.log('api running on port: ', this.port);
        });



    }


}

let srv = new Server();