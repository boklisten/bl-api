import {JwtPayload, SEToken} from "../auth/token/se.token";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {Request, Response, Router} from "express";
import {LoginOption, Method} from "./endpoint.express";
import * as passport from "passport";
import {BlapiResponse} from 'bl-model';
import {SEDocument} from "../db/model/se.document";
import {BlError} from "../bl-error/bl-error";

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
			let blError = new BlError('').className('EndpointPatchExpress').methodName('createLoginPatch');
			this.seToken.validatePayload(req.user.jwtPayload, loginOptions).then(
				(jwtPayload: JwtPayload) => {
					if (loginOptions.restrictedToUserOrAbove) {
						this.enpointMongoDb.getAndValidateByUserBlid(req.params.id, jwtPayload.blid).then(
							(docs: SEDocument[]) => {
								this.patchDocument(res, req.params.id, req.body);
							},
							(validateByBlidError: BlError) => {
								if (this.seToken.permissionAbove(jwtPayload.permission, loginOptions.permissions)) {
									this.patchDocument(res, req.params.id, req.body);
								} else {
									this.resHandler.sendErrorResponse(res, validateByBlidError.add(
										blError
											.msg('could not validate blid')
											.store('jwtPayload', jwtPayload)
											.store('url', url)).code(401));
								}
							});
					} else {
						this.patchDocument(res, req.params.id, req.body);
					}
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

	private patchDocument(res: Response, id: string, body: any) {
		this.enpointMongoDb.patch(id, body).then(
			(docs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new BlapiResponse(docs));
			},
			(error: BlError) => {
				this.resHandler.sendErrorResponse(res, error.add(new BlError('could not patch document')
					.className('EndpointPatchExpress')
					.methodName('patchDocument')));
			});
	}

}