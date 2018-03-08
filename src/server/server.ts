import * as express from 'express';
import {Application, Request, Response, Router} from "express";
import * as passport from "passport";
import {APP_CONFIG} from "../application-config";
import {BlAuth} from "../auth/bl.auth";
import {BlEndpoint} from "../endpoint/bl.endpoint";
import {PaymentModule} from "../payment/payment.module";
import {SEResponseHandler} from "../response/se.response.handler";
let bodyParser = require('body-parser');
const chalk = require('chalk');
const packageJson = require('../../package.json');

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

		let cors = require('cors');
		
		let whitelist = ['http://localhost:4200', '*', '127.0.0.1'];
		let allowedMethods = ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'];
		let allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'];
	
		
		let corsConfig = {
			origin: whitelist,
			methods: allowedMethods,
			allowedHeaders: allowedHeaders,
			preflightContinue: false,
			optionsSuccessStatus: 204
		};
		
		this.app.use(cors(corsConfig));
		
		//this.app.use(session({secret: 'hello there'}));
		this.app.use(require('cookie-parser')());
		this.app.use(passport.initialize());
		this.app.use(passport.session());

		this.router = Router();
		
		
		let debugLogPath = (req: Request, res: Response, next: any) => {
			let d = new Date();
			let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			console.log(chalk.blue('> ') + chalk.gray.bold('[' + d.toISOString() + ']' + chalk.gray('(' + ip + ')')));
			console.log(chalk.bold.dim.yellow('\t' + req.method + ' ') + chalk.green(req.url));
			next();
		};
		
		this.app.use(debugLogPath);
		
		
		this.initModules();
		
		
		this.app.use(this.router);
	}
	
	private test() {
	
	}
	
	private initModules() {
		let paymentModule = new PaymentModule(this.router, new SEResponseHandler());
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
		console.log(chalk.blue(`\t _     _             _\n`+
			                   `\t| |__ | | __ _ _ __ (_)\n`+
			                   `\t| '_ \\| |/ _\` | '_ \\| |\n`+
			                   `\t| |_) | | (_| | |_) | |\n`+
							   `\t|_.__/|_|\\__,_| .__/|_|\n`+
			                   `\t	      |_| v${packageJson.version}\n`));
		console.log(chalk.blue('\t# ') + chalk.gray('hostname:\t') + chalk.dim.green(this.getServerPath()));
		console.log(chalk.blue('\t# ') + chalk.gray('mongoDb: \t') + chalk.dim.green(this.getMongoDbPath()) + '\n');
	}

	private getMongoDbPath(): string {
		return APP_CONFIG.dev.mongoDb.basePath + APP_CONFIG.dev.mongoDb.host + ':' + APP_CONFIG.dev.mongoDb.port + '/' + APP_CONFIG.dev.mongoDb.dbName;
	}

	private getServerPath(): string {
		return APP_CONFIG.dev.server.host + ':' + APP_CONFIG.dev.server.port + '/' + APP_CONFIG.dev.server.path + '/' + APP_CONFIG.dev.server.version;
	}
}

