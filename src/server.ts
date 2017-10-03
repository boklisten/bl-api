
import * as express from 'express';
import {Application} from "express";
import {ItemModel} from "./db/model/item/item.model";
import {MongoHandler} from "./db/mongoHandler";

export class Server {

    public app: Application;


    constructor() {
        this.app = express();

        this.app.get('/', (req, res) => {
            res.send('Hello there')
        });

        this.app.listen(3000, () => {
           console.log('bl_api listening on: 3000');
        });

        let mongoHandler = new MongoHandler();


    }


}

let srv = new Server();