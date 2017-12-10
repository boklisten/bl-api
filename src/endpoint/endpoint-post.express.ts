
import {SEResponseHandler} from "../response/se.response.handler";
import {JwtPayload, SEToken} from "../auth/token/se.token";
import {EndpointMongodb} from "./endpoint.mongodb";
import {Request, Response, Router} from "express";
import {LoginOption, Method, Path} from "./endpoint.express";
import * as passport from "passport";
import {BlapiResponse, BlapiErrorResponse} from 'bl-model';
import {SEDocument} from "../db/model/se.document";
import {BlError} from "../bl-error/bl-error";

export class EndpointPostExpress {
	private resHandler: SEResponseHandler;
	private seToken: SEToken;
	private endpointMongoDb: EndpointMongodb;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.seToken = new SEToken();
		this.endpointMongoDb = endpointMongoDb;

	}

	public createPostEndpoint(router: Router, method: Method, url: string, collectionName: string) {
		if (method.login && method.loginOptions) {
			this.createLoginPost(router, url, collectionName, method.loginOptions);
		}
	}

	private createLoginPost(router: Router, url: string, collectionName: string,  loginOptions: LoginOption) {
		router.post(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			let blError = new BlError('').className('EndpointPostExpress').methodName('loginPost');
			this.seToken.validatePayload(req.user.jwtPayload, loginOptions).then(
				(jwtPayload: JwtPayload) => {
					this.endpointMongoDb.post(new SEDocument(collectionName, req.body)).then(
						(docs: SEDocument[]) => {
							this.resHandler.sendResponse(res, new BlapiResponse(docs));
						},
						(error: BlError) => {
							this.resHandler.sendErrorResponse(res, error.add(blError.msg('could not post document')
								.store('url', url)
								.store('body', req.body)));
						});
				},
				(validatePayloadError: BlError) => {
					this.resHandler.sendErrorResponse(res, validatePayloadError.add(
						blError
							.msg('could not validate jwt payload')
							.store('jwtPayload', req.user.jwtPayload)
							.store('url', url)
					));
				});
		});
	}
}
