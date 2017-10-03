
import * as express from 'express';
import {Application} from "express";

export class Server {

    public app: Application;

    constructor() {
        this.app = express();
    }


}