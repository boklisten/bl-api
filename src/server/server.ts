// IMPORTANT TO KEEP THIS ON TOP
// eslint-disable-next-line import/order
import dotenv from "dotenv";
dotenv.config(); //adds the .env file to environment variables

import path from "path";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, json, Request, Response, Router } from "express";
import mongoose from "mongoose";
import passport from "passport";

import * as packageJson from "../../package.json";
import { BlAuth } from "../auth/bl.auth";
import { CollectionEndpointCreator } from "../collection-endpoint/collection-endpoint-creator";
import { logger } from "../logger/logger";

export class Server {
  public app: Application;
  private router: Router;

  constructor() {
    this.printServerStartMessage();
    this.initialServerConfig();
    this.initialPassportConfig();
    new BlAuth(this.router);
    this.generateEndpoints();
    this.connectToDbAndStartServer();
  }

  private connectToDbAndStartServer() {
    this.connectToMongoDb()
      .then(() => {
        this.serverStart();
      })
      .catch((err) => {
        logger.error(`could not connect to mongodb: ${err}`);

        if (
          err
            .toString()
            .match(/failed to connect to server .* on first connect/g)
        ) {
          const interval = 5000;
          logger.error(
            `failed to connect to mongodb, will try again in ${interval} sec`,
          );

          setTimeout(() => {
            this.connectToDbAndStartServer();
          }, interval);
        }
      });
  }

  private connectToMongoDb(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      logger.verbose(
        `trying to connect to mongodb: ${process.env.MONGODB_URI}`,
      );

      mongoose.connection.on("disconnected", () => {
        logger.error("mongoose connection was disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        logger.warn("mongoose connection was reconnected");
      });

      mongoose.connection.on("error", () => {
        logger.error("mongoose connection has error");
      });

      mongoose
        .connect(process.env.MONGODB_URI, {
          maxPoolSize: 10,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        })
        .then(() => {
          logger.verbose(`connected to mongodb: ${process.env.MONGODB_URI}`);
          resolve(true);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private initialServerConfig() {
    this.app = express();
    this.app.use(json());

    process.on("unhandledRejection", (reason, p) => {
      logger.error(`unhandeled rejection at: ${p}, reason: ${reason}`);
    });

    const whitelist = process.env.URI_WHITELIST.split(" ");
    const allowedMethods = ["GET", "PUT", "PATCH", "POST", "DELETE"];
    const allowedHeaders = [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ];

    const corsConfig = {
      origin: whitelist,
      methods: allowedMethods,
      allowedHeaders: allowedHeaders,
      preflightContinue: true,
      optionsSuccessStatus: 204,
    };

    this.app.use(process.env.API_ENV === "staging" ? cors() : cors(corsConfig));
    this.app.use(cookieParser());
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.router = Router();

    const debugLogPath = (req: Request, _res: Response, next: () => void) => {
      if (req.method !== "OPTIONS") {
        // no point in showing all the preflight requests
        logger.debug(`-> ${req.method} ${req.url}`);
        if (
          !(req.url.includes("auth") && process.env.NODE_ENV === "production")
        ) {
          let body: string;
          try {
            body = JSON.stringify(req.body);
          } catch (e) {
            body = req.body.toString("utf8");
          }

          logger.silly(`-> ${body}`);
        }
      }
      next();
    };

    this.app.get("*", (req, res, next) => {
      if (
        req.headers["x-forwarded-proto"] !== "https" &&
        process.env.NODE_ENV === "production"
      ) {
        res.redirect("https://" + req.hostname + req.url);
      } else {
        next();
      }
    });

    this.app.use(debugLogPath);
    this.app.use(this.router);
  }

  private generateEndpoints() {
    const collectionEndpointCreator = new CollectionEndpointCreator(
      this.router,
    );
    collectionEndpointCreator.create();
  }

  private initialPassportConfig() {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    passport.serializeUser((user: any, done: any) => {
      done(null, user);
    });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    passport.deserializeUser((user: any, done: any) => {
      done(null, user);
    });
  }

  private serverStart() {
    this.app.set("port", process.env.PORT || 1337);

    // eslint-disable-next-line import/no-named-as-default-member
    this.app.use(express.static(path.join(__dirname, "../public")));

    this.app.listen(this.app.get("port"), () => {
      logger.info("blapi is ready to take requests!");
    });

    this.app.on("uncaughtException", (err) => {
      logger.warn("uncaught exception:" + err);
    });

    this.app.on("SIGTERM", () => {
      logger.warn("user quit the program");
    });

    this.app.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.warn("mongoose connection disconnected through app termination");
      process.exit(0);
    });
  }

  private printServerStartMessage() {
    logger.verbose("starting blapi");

    logger.silly("  _     _             _");
    logger.silly(" | |__ | | __ _ _ __ (_)");
    logger.silly(" | '_ \\| |/ _` | '_ \\| |");
    logger.silly(" | |_) | | (_| | |_) | |");
    logger.silly(" |_.__/|_|\\__,_| .__/|_|");
    logger.silly(`               |_| v${packageJson.version}`);

    logger.verbose(
      "server url:\t" +
        process.env.SERVER_HOST +
        process.env.SERVER_PORT +
        process.env.SERVER_PATH,
    );
    logger.verbose("mongoDB path:\t" + process.env.MONGODB_URI);
  }
}
