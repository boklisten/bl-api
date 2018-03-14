import * as express from 'express';
import {Application, Request, Response, Router} from "express";
import * as passport from "passport";
import {APP_CONFIG} from "../application-config";
import {BlAuth} from "../auth/bl.auth";
import {BlEndpointCreator} from "../collections/bl-endpoint-creator";
import * as https from "https";
let bodyParser = require('body-parser');
const chalk = require('chalk');
const packageJson = require('../../package.json');
const fs = require('fs');


export class Server {

	public app: Application;
	private router: Router;
	private blAuth: BlAuth;

	constructor() {
		require('dotenv').config(); //adds the .env file to environment variables
		
		this.printServerStartMessage();
		
		this.initialServerConfig();
		this.initialPassportConfig();

		this.blAuth = new BlAuth(this.router);
		
		this.generateEndpoints();
		
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
		
		let whitelist = ['https://localhost:4200', '*', '127.0.0.1'];
		let allowedMethods = ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'];
		let allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'];
	
		
		let corsConfig = {
			origin: whitelist,
			methods: allowedMethods,
			allowedHeaders: allowedHeaders,
			preflightContinue: true,
			optionsSuccessStatus: 204
		};
		
		this.app.use(cors(corsConfig));
		
		//this.app.use(session({secret: 'hello there'}));
		this.app.use(require('cookie-parser')());
		this.app.use(passport.initialize());
		this.app.use(passport.session());

		this.router = Router();
		
		
		this.test();
		
		
		
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
	
	private generateEndpoints() {
		const endpointCreator = new BlEndpointCreator(this.router);
		endpointCreator.createAll();
	}
	
	private initModules() {
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
		const privateKey = fs.readFileSync('localhost_bl-api.key');
		const cert = fs.readFileSync('localhost_bl-api.crt');
		
		const credentials = {key: privateKey, cert: cert};
		
		
		const httpsServer = https.createServer(credentials, this.app);
		
		httpsServer.on('listening', () => {
			console.log(chalk.blue('\t#') + chalk.gray(' server is up and running'));
		});
		
		httpsServer.listen(APP_CONFIG.dev.server.port);
		
		/*
		this.app.listen(APP_CONFIG.dev.server.port, () => {
			console.log(chalk.blue('\t#') + chalk.gray(' server is up and running\n'));
		});
		*/
	}
	
	private printServerStartMessage() {
		console.log(chalk.blue(`\t _     _             _\n`+
			                   `\t| |__ | | __ _ _ __ (_)\n`+
			                   `\t| '_ \\| |/ _\` | '_ \\| |\n`+
			                   `\t| |_) | | (_| | |_) | |\n`+
							   `\t|_.__/|_|\\__,_| .__/|_|\n`+
			                   `\t	      |_| v${packageJson.version}\n`));
		
		console.log(chalk.blue('\t# ') + chalk.gray('hostname:\t') + chalk.dim.green(this.getServerPath()));
		console.log(chalk.blue('\t# ') + chalk.gray('mongoDb: \t') + chalk.dim.green(this.getMongoDbPath()));
	}

	private getMongoDbPath(): string {
		return process.env.MONGODB_HOST;
	}

	private getServerPath(): string {
		return process.env.SERVER_HOST;
	}
}

