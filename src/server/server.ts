import * as express from 'express';
import {Application, Request, Response, Router} from "express";
import * as passport from "passport";
import {APP_CONFIG} from "../application-config";
import {BlAuth} from "../auth/bl.auth";
import {BlEndpoint} from "../endpoint/bl.endpoint";
let bodyParser = require('body-parser');

export class Server {

	public app: Application;
	private router: Router;
	private blEndpoint: BlEndpoint;
	private blAuth: BlAuth;


	constructor() {

		this.initialServerConfig();
		this.initialPassportConfig();

		this.blEndpoint = new BlEndpoint(this.router);
		this.blAuth = new BlAuth(this.router);

		this.mongoDbStart();
		this.serverStart();
	}

	private mongoDbStart() {
		let mongoose = require('mongoose');
		mongoose.Promise = require('bluebird');
		mongoose.connect(this.getMongoDbPath(), {useMongoClient: true});
	}

	private initialServerConfig() {
		this.app = express();

		this.app.use(bodyParser.json());

		//let cors = require('cors');

		//cors({
		//	'Access-Control-Allow-Origin': 'localhost'
		//});
		//this.app.use(cors());
		//this.app.use(session({secret: 'hello there'}));
		this.app.use(require('cookie-parser')());
		this.app.use(passport.initialize());
		this.app.use(passport.session());

		this.router = Router();
		
		
		let debugLogPath = (req: Request, res: Response, next: any) => {
			let d = new Date();
			let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			console.log('[' + d.toISOString() + '](' + ip + ') ' + req.method + ' ' + req.url);
			next();
		};
		
		this.app.use(debugLogPath);
		
		this.app.use(this.router);
	}

	private initialPassportConfig() {
		passport.serializeUser((user: any, done: any) => {
			done(null, user);
		});

		passport.deserializeUser((user: any, done: any) => {
			done(null, user);
		});
	}

	private serverStart() {
		this.app.listen(APP_CONFIG.dev.server.port, () => {
			this.printServerStartMessage();
		});
	}

	private printServerStartMessage() {
		console.log('\n\t######');
		console.log('\t#\tBL_API now running');
		console.log('\t#\tapi: \t\t' + this.getServerPath());
		console.log('\t#\tmongoDB: \t' + this.getMongoDbPath());
		console.log('\t######\n');

	}

	private getMongoDbPath(): string {
		return APP_CONFIG.dev.mongoDb.basePath + APP_CONFIG.dev.mongoDb.host + ':' + APP_CONFIG.dev.mongoDb.port + '/' + APP_CONFIG.dev.mongoDb.dbName;
	}

	private getServerPath(): string {
		return APP_CONFIG.dev.server.host + ':' + APP_CONFIG.dev.server.port + '/' + APP_CONFIG.dev.server.path + '/' + APP_CONFIG.dev.server.version;
	}
}

