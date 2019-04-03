import * as express from 'express';
import {Application, Request, Response, Router} from 'express';
import * as passport from 'passport';
import {BlAuth} from '../auth/bl.auth';
import {CollectionEndpointCreator} from '../collection-endpoint/collection-endpoint-creator';
import * as path from 'path';
import {logger} from '../logger/logger';
import {APP_CONFIG} from '../application-config';

let bodyParser = require('body-parser');
const chalk = require('chalk');
const packageJson = require('../../package.json');

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
    mongoose.connect(
      process.env.MONGODB_URI,
      {
        useMongoClient: true,
        useNewUrlParser: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500,
        poolSize: 10,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      },
    );
  }

  private initialServerConfig() {
    this.app = express();
    this.app.use(bodyParser.json());
    let cors = require('cors');

    let whitelist = process.env.URI_WHITELIST.split(' ');
    let allowedMethods = ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'];
    let allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'];

    let corsConfig = {
      origin: whitelist,
      methods: allowedMethods,
      allowedHeaders: allowedHeaders,
      preflightContinue: true,
      optionsSuccessStatus: 204,
    };

    this.app.use(cors(corsConfig));
    this.app.use(require('cookie-parser')());
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.router = Router();

    let debugLogPath = (req: Request, res: Response, next: any) => {
      let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (req.method !== 'OPTIONS') {
        // no point in showing all the preflight requests
        logger.verbose(`${'-> ' + chalk.bold(req.method)} ${req.url}`);
      }
      next();
    };

    this.app.get('*', (req, res, next) => {
      if (
        req.headers['x-forwarded-proto'] !== 'https' &&
        process.env.NODE_ENV === 'production'
      ) {
        res.redirect('https://' + req.hostname + req.url);
      } else {
        next();
      }
    });

    this.app.use(debugLogPath);
    this.initModules();
    this.app.use(this.router);
  }

  private generateEndpoints() {
    const collectionEndpointCreator = new CollectionEndpointCreator(
      this.router,
    );
    collectionEndpointCreator.create();
  }

  private initModules() {}

  private initialPassportConfig() {
    passport.serializeUser((user: any, done: any) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done: any) => {
      done(null, user);
    });
  }

  private serverStart() {
    this.app.set('port', process.env.PORT || 1337);

    this.app.use(express.static(path.join(__dirname, '../public')));

    this.app.listen(this.app.get('port'), () => {
      logger.info(chalk.bold('blapi is ready to take requests!\n'));
    });

    this.app.on('uncaughtException', () => {
      console.log('an error occured');
    });

    this.app.on('SIGTERM', () => {
      console.log('user quit the program');
    });
  }

  private printServerStartMessage() {
    logger.info(chalk.bold.blue('  _     _             _'));
    logger.info(chalk.bold.blue(' | |__ | | __ _ _ __ (_)'));
    logger.info(chalk.bold.blue(" | '_ \\| |/ _` | '_ \\| |"));
    logger.info(chalk.bold.blue(' | |_) | | (_| | |_) | |'));
    logger.info(chalk.bold.blue(' |_.__/|_|\\__,_| .__/|_|'));
    logger.info(chalk.bold.blue(`               |_| v${packageJson.version}`));
    logger.info(
      'path:    ' + 'localhost:' + process.env.PORT + process.env.SERVER_PATH,
    );
    logger.info('mongoDB: ' + process.env.MONGODB_URI);
  }
}
