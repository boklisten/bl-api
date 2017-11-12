import {JwtPayload, SEToken} from "../auth/token/se.token";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {Request, Response, Router} from "express";
import {LoginOption, Method} from "./endpoint.express";
import * as passport from "passport";
import {BlapiResponse, BlapiErrorResponse} from 'bl-model';
import {SEDocument} from "../db/model/se.document";

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
					if (loginOptions.restrictedToUserOrAbove) {
						this.enpointMongoDb.getAndValidateByUserBlid(req.params.id, jwtPayload.blid).then(
							(docs: SEDocument[]) => {
								this.patchDocument(res, req.params.id, req.body);
							},
							(error: any) => {
								if (this.seToken.permissionAbove(jwtPayload.permission, loginOptions.permissions)) {
									this.patchDocument(res, req.params.id, req.body);
								} else {
									this.resHandler.sendErrorResponse(res, new BlapiErrorResponse(403));
								}
							});
					} else {
						this.patchDocument(res, req.params.id, req.body);
					}
				},
				(error: any) => {
					this.resHandler.sendErrorResponse(res, new BlapiErrorResponse(403));
				});
		});
	}

	private patchDocument(res: Response, id: string, body: any) {
		this.enpointMongoDb.patch(id, body).then(
			(docs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new BlapiResponse(docs));
			},
			(error: BlapiErrorResponse) => {
				this.resHandler.sendErrorResponse(res, error);
			});
	}

}