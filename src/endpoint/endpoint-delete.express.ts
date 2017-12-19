

import {SEResponseHandler} from "../response/se.response.handler";
import {EndpointMongodb} from "./endpoint.mongodb";
import {Request, Response, Router} from "express";
import {LoginOption, Method} from "./endpoint.express";
import * as passport from "passport";
import {JwtPayload, SEToken} from "../auth/token/se.token";
import {SEDocument} from "../db/model/se.document";

import {BlapiResponse, BlapiErrorResponse} from 'bl-model';
import {BlError} from "../bl-error/bl-error";
import {BlErrorHandler} from "../bl-error/bl-error-handler";
import {AccessToken} from "../auth/token/access-token/access-token";

export class EndpointDeleteExpress {
	private resHandler: SEResponseHandler;
	private endpointMongoDb: EndpointMongodb;
	private seToken: SEToken;
	private blErrorHandler: BlErrorHandler;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.endpointMongoDb = endpointMongoDb;
		this.seToken = new SEToken();
		this.blErrorHandler = new BlErrorHandler();
	}

	public createDeleteEndpoint(router: Router, method: Method, url: string) {
		if (method.login && method.loginOptions) {
			this.createLoginDelete(router, url, method.loginOptions);
		}
	}

	
	private createLoginDelete(router: Router, url: string, loginOptions: LoginOption) {
		router.delete(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			let blError = new BlError('').className('EndpointDeleteExpress').methodName('loginDelete');
			const accessToken: AccessToken = req.user.accessToken;
			
			if (!accessToken) this.resHandler.sendErrorResponse(res, new BlError('no access token found').store('url', url).code(905));
			
			if (loginOptions.restrictedToUserOrAbove) {
				this.endpointMongoDb.getAndValidateByUserBlid(req.params.id, jwtPayload.blid).then(
					(docs: SEDocument[]) => {//user has access
						this.deleteDocument(res, req.params.id);
					},
					(error: BlError) => {
						
						if (this.seToken.permissionAbove(accessToken.permission, loginOptions.permissions)) {
							this.deleteDocument(res, req.params.id);
						} else {
							this.resHandler.sendErrorResponse(res, error.add(
								blError.msg('user does not have the right permission')
									.store('accessTokenPayload', accessToken)
									.store('url', url)).code(401));
						}
						
					});
			} else {
				this.deleteDocument(res, req.params.id);
			}
		});
	}

	private deleteDocument(res: Response, id: string) {
		
		this.endpointMongoDb.deleteById(id).then(
			(deletedDocs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new BlapiResponse(deletedDocs));
			},
			(error: BlError) => {
				this.resHandler.sendErrorResponse(res, error.add(new BlError('could not delete document by id').store('documentId', id)));
			});
	}
}