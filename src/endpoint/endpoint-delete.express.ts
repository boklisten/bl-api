

import {SEResponseHandler} from "../response/se.response.handler";
import {EndpointMongodb} from "./endpoint.mongodb";
import {Request, Response, Router} from "express";
import {LoginOption, Method} from "./endpoint.express";
import * as passport from "passport";
import {JwtPayload, SEToken} from "../auth/token/se.token";
import {SEDocument} from "../db/model/se.document";
import {SEResponse} from "../response/se.response";
import {SEErrorResponse} from "../response/se.error.response";

export class EndpointDeleteExpress {
	private resHandler: SEResponseHandler;
	private endpointMongoDb: EndpointMongodb;
	private seToken: SEToken;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.endpointMongoDb = endpointMongoDb;
		this.seToken = new SEToken();
	}

	public createDeleteEndpoint(router: Router, method: Method, url: string) {
		if (method.login && method.loginOptions) {
			this.createLoginDelete(router, url, method.loginOptions);
		}
	}

	private createLoginDelete(router: Router, url: string, loginOptions: LoginOption) {
		router.delete(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			this.seToken.validatePayload(req.user.jwtPayload, loginOptions).then(
				(jwtPayload: JwtPayload) => {
					if (loginOptions.restrictedToUserOrAbove) {
						this.endpointMongoDb.getAndValidateByUserBlid(req.params.id, jwtPayload.blid).then(
							(docs: SEDocument[]) => {//user has access
								this.deleteDocument(res, req.params.id);
							},
							(error: SEErrorResponse) => {
								if (this.seToken.permissionAbove(jwtPayload.permission, loginOptions.permissions)) {
									this.deleteDocument(res, req.params.id);
								} else {
									this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
								}
							});
					} else {
						this.deleteDocument(res, req.params.id);
					}
				},
				(error: any) => {
					this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
				});
		});
	}

	private deleteDocument(res: Response, id: string) {
		this.endpointMongoDb.deleteById(id).then(
			(deletedDocs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new SEResponse(deletedDocs));
			},
			(error: SEErrorResponse) => {
				this.resHandler.sendErrorResponse(res, error);
			});
	}
}