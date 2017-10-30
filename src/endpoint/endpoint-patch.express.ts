import {JwtPayload, SEToken} from "../auth/token/se.token";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {Request, Response, Router} from "express";
import {LoginOption, Method} from "./endpoint.express";
import * as passport from "passport";
import {SEDocument} from "../db/model/se.document";
import {SEErrorResponse} from "../response/se.error.response";
import {SEResponse} from "../response/se.response";

export class EndpointPatchExpress {
	private seToken: SEToken;
	private enpointMongoDb: EndpointMongodb;
	private resHandler: SEResponseHandler;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.enpointMongoDb = endpointMongoDb;
	}

	public createPatchEndpoint(router: Router, method: Method, url: string) {
		if (method.login && method.loginOptions) {
			this.createLoginPatch(router, url, method.loginOptions);
		}

	}

	private createLoginPatch(router: Router, url: string, loginOptions: LoginOption) {
		router.patch(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			this.seToken.validatePayload(req.user.jwtPayload, loginOptions).then(
				(jwtPayload: JwtPayload) => {
					this.enpointMongoDb.patch(req.params.id, req.body).then(
						(docs: SEDocument[]) => {
							this.resHandler.sendResponse(res, new SEResponse(docs));
						},
						(error: SEErrorResponse) => {
							this.resHandler.sendErrorResponse(res, error);
						});
				});
		});
	}
}