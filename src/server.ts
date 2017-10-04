
import * as express from 'express';
import * as mongoose from 'mongoose';
import {Schema} from 'mongoose';
import {EndpointConfig, EndpointExpress} from "./endpoint/endpoint.express";
import {Application, Router} from "express";
import {SESchema} from "./config/schema/se.schema";
import {SESchemaConfig} from "./config/schema/se.schema.config";
let bodyParser = require('body-parser');

export class Server {

    public app: Application;
    private router: Router;
    private port: number;


    constructor() {

        this.app = express();
        this.app.use(bodyParser.json());
        this.port = 3000;

        mongoose.connect('mongodb://localhost:27017/bl_test_a');

        let schemaConfig: SESchemaConfig = {
            name: 'item',
            permissionLevel: 0,
            values: [
                {
                    name: 'title',
                    type: Schema.Types.String,
                    required: true,
                    permissionLevel: 0
                }
            ]
        };

        let testSchema = new SESchema(schemaConfig);




        let config: EndpointConfig = {
            basePath: '/api',
            collectionName: 'item',
            schema: testSchema,
            paths: [
                {
                    path: '/items',
                    id: false,
                    methods: [
                        {
                            method: 'get',
                            permissionLevel: 0
                        },
                        {
                            method: "post",
                            permissionLevel: 0
                        }
                    ]
                }
            ]

        };

        this.router = Router();

        let endpointExpress = new EndpointExpress(this.router, config);

        this.app.use(this.router);

        this.app.listen(this.port, () => {
            console.log('api running on port: ', this.port);
        });



    }


}

let srv = new Server();