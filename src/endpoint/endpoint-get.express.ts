

import {Request, Response, Router} from "express";
import {LoginOption, Method, Path} from "./endpoint.express";
import {SEDocument} from "../db/model/se.document";
import {SEResponseHandler} from "../response/se.response.handler";
import {SEErrorResponse} from "../response/se.error.response";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEDbQueryBuilder} from "../query/se.db-query-builder";
import {SEResponse} from "../response/se.response";
import {ValidParam} from "../query/valid-param/db-query-valid-params";
import * as passport from 'passport';
import {JwtPayload, SEToken} from "../auth/token/se.token";

export class EndpointGetExpress {
	private resHandler: SEResponseHandler;
	private seQueryBuilder: SEDbQueryBuilder;
	private endpointMongoDb: EndpointMongodb;
	private seToken: SEToken;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.seQueryBuilder = new SEDbQueryBuilder();
		this.endpointMongoDb = endpointMongoDb;
		this.seToken = new SEToken();
	}

	public createGetEndpoint(router: Router, path: Path, method: Method, url: string, validSearchParams?: ValidParam[]) {
		if (path.id) {
			if (method.login) {
				this.createLoginGetWithId(router, url, method.loginOptions);
			} else {
				this.createGetWithId(router, url);
			}
		} else {
			if (method.login) {
				this.createLoginGet(router, url, validSearchParams, method.loginOptions);
			} else {
				this.createGet(router, url, validSearchParams);
			}
		}
	}

	private createGet(router: Router, url: string, validSearchParams?: ValidParam[]) {
		router.get(url, (req: Request, res: Response) => {
			this.handleGetWithQuery(req, res, validSearchParams);
		});
	}

	private createGetWithId(router: Router, url: string) {
		router.get(url, (req: Request, res: Response) => {
			this.handleGetWithId(req, res);
		});
	}

	private createLoginGet(router: Router, url: string, validSearchParams?: ValidParam[], loginOptions?: LoginOption) {
		router.get(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			this.seToken.validatePayload(req.user.jwtPayload, loginOptions).then(
				(jwtPayload: JwtPayload) => {
					this.handleGetWithQuery(req, res, validSearchParams);
				},
				(error: any) => {
					this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
				});
		});
	}

	private createLoginGetWithId(router: Router, url: string, loginOptions?: LoginOption) {
		router.get(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			this.seToken.validatePayload(req.user.jwtPayload, loginOptions).then(
				(jwtPayload: JwtPayload) => {
					if (loginOptions && loginOptions.restrictedToUserOrAbove) {
						this.endpointMongoDb.getAndValidateByUserBlid(req.params.id, jwtPayload.blid).then(
							(docs: SEDocument[]) => {
								this.resHandler.sendResponse(res, new SEResponse(docs));
							},
							(error: SEErrorResponse) => {
								if (this.seToken.permissionAbove(jwtPayload.permission, loginOptions.permissions)) {
									this.handleGetWithId(req, res);
								} else {
									this.resHandler.sendErrorResponse(res, error);
								}
							});
					} else {
						this.handleGetWithId(req, res);
					}
				},
				(error: any) => {
					this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
				})
		});
	}

	private handleGetWithId(req: Request, res: Response) {
		this.endpointMongoDb.getById(req.params.id).then(
			(docs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new SEResponse(docs));
			},
			(error: SEErrorResponse) => {
				this.resHandler.sendErrorResponse(res, error);
			});
	}

	private handleGetWithQuery(req: Request, res: Response, validSearchParams?: ValidParam[]) {
		if (!validSearchParams) validSearchParams = [];
		try {
			let dbQuery = this.seQueryBuilder.getDbQuery(req.query, validSearchParams);

			this.endpointMongoDb.get(dbQuery).then(
				(docs: SEDocument[]) => {
					this.resHandler.sendResponse(res, new SEResponse(docs));
				},
				(error: SEErrorResponse) => {
					this.resHandler.sendErrorResponse(res, error);
				});
		} catch (error) {
			this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
		}
	}
}