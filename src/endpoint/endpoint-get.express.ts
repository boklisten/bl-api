

import {Request, Response, Router} from "express";
import {LoginOption, Method, Path} from "./endpoint.express";
import {SEDocument} from "../db/model/se.document";
import {SEResponseHandler} from "../response/se.response.handler";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEDbQueryBuilder} from "../query/se.db-query-builder";
import {ValidParam} from "../query/valid-param/db-query-valid-params";
import * as passport from 'passport';
import {JwtPayload, SEToken} from "../auth/token/se.token";
import {BlapiErrorResponse, BlapiResponse} from 'bl-model';
import {BlError} from "../bl-error/bl-error";
import {BlErrorHandler} from "../bl-error/bl-error-handler";
import {AccessToken} from "../auth/token/access-token/access-token";
import {Hook} from "../hook/hook";


export class EndpointGetExpress {
	private resHandler: SEResponseHandler;
	private seQueryBuilder: SEDbQueryBuilder;
	private endpointMongoDb: EndpointMongodb;
	private seToken: SEToken;
	private errorHandler: BlErrorHandler;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.seQueryBuilder = new SEDbQueryBuilder();
		this.endpointMongoDb = endpointMongoDb;
		this.seToken = new SEToken();
		this.errorHandler = new BlErrorHandler();
	}

	public createGetEndpoint(router: Router, path: Path, method: Method, url: string, validSearchParams?: ValidParam[]) {
		if (path.id) {
			if (method.login) {
				this.createLoginGetWithId(router, url, method);
			} else {
				this.createGetWithId(router, url);
			}
		} else {
			if (method.login) {
				this.createLoginGet(router, url, method, validSearchParams);
			} else {
				this.createGet(router, url, method, validSearchParams);
			}
		}
	}

	private createGet(router: Router, url: string, method: Method, validSearchParams?: ValidParam[]) {
		router.get(url, (req: Request, res: Response) => {
			if (method.hook) {
				method.hook.run().then(() => {
					console.log('hook are done!');
				})
			}
			this.handleGetWithQuery(req, res, validSearchParams);
		});
	}

	private createGetWithId(router: Router, url: string, method: Method) {
		router.get(url, (req: Request, res: Response) => {
			this.handleGetWithId(req, res);
		});
	}

	private createLoginGet(router: Router, url: string, method: Method, validSearchParams?: ValidParam[]) {
		router.get(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			this.handleGetWithQuery(req, res, validSearchParams);
		});
	}

	private createLoginGetWithId(router: Router, url: string, method: Method) {
		router.get(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			let blError = new BlError('').className('EndpointGetExpress').methodName('loginGetWithId');
			let accessToken: AccessToken = req.user.accessToken;
			if (!accessToken) this.resHandler.sendErrorResponse(res, new BlError('accessToken not found').code(905));
			
			if (method.loginOptions && method.loginOptions.restrictedToUserOrAbove) {
				this.endpointMongoDb.getAndValidateByUserBlid(req.params.id, accessToken.sub).then(
					(docs: SEDocument[]) => {
						this.handleHook(method.hook)
						this.resHandler.sendResponse(res, new BlapiResponse(docs));
					},
					(validateByBlidError: BlError) => {
						if (this.seToken.permissionAbove(accessToken.permission, method.loginOptions.permissions)) {
							this.handleGetWithId(req, res);
						} else {
							this.resHandler.sendErrorResponse(res, validateByBlidError.add(
								blError.msg('could not validate by blid')
									.store('url', url)
									.store('accessToken', accessToken)
									.code(904)));
							
						}
					});
			} else {
				this.handleGetWithId(req, res);
			}
		});
	}

	private handleGetWithId(req: Request, res: Response) {
		this.endpointMongoDb.getById(req.params.id).then(
			(docs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new BlapiResponse(docs));
			},
			(error: BlError) => {
				this.resHandler.sendErrorResponse(res, error.add(
					new BlError('could not get document with id')
						.className('EndpointGetExpress')
						.methodName('handleGetWithId')
						.store('id', req.params.id)
						.code(702)));
			});
	}

	private handleGetWithQuery(req: Request, res: Response, validSearchParams?: ValidParam[]) {
		if (!validSearchParams) validSearchParams = [];
		let blError = new BlError('').className('EndpointGetExpress').methodName('handleGetWithQuery');
		
		try {
			let dbQuery = this.seQueryBuilder.getDbQuery(req.query, validSearchParams);
			this.endpointMongoDb.get(dbQuery).then(
				(docs: SEDocument[]) => {
					this.resHandler.sendResponse(res, new BlapiResponse(docs));
				},
				(getDocError: BlError) => {
					this.resHandler.sendErrorResponse(res, getDocError.add(
						blError.msg('could not get documents')
							.store('dbQuery', dbQuery)));
				});
		} catch (error) {
			this.resHandler.sendErrorResponse(res, blError.store('unknown error', error));
		}
	}
	
	private handleResponse(req: any, res: any, docs: SEDocument[], hook?: any) {
		this.handleHook(hook, docs, req)
	}
	
	private handleHook(hook: Hook, docs?: any[], req?: any) {
	
	}
}