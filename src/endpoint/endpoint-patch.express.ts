import {JwtPayload, SEToken} from "../auth/token/se.token";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {Request, Response, Router} from "express";
import {LoginOption, Method} from "./endpoint.express";
import * as passport from "passport";
import {BlapiResponse} from 'bl-model';
import {SEDocument} from "../db/model/se.document";
import {BlError} from "../bl-error/bl-error";
import {AccessToken} from "../auth/token/access-token/access-token";

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
			const accessToken: AccessToken = req.user.accessToken;
			if (!accessToken) return this.resHandler.sendErrorResponse(res,
				new BlError('accessToken not found')
					.store('url', url)
					.code(905));
			
			if (loginOptions.restrictedToUserOrAbove) {
				this.enpointMongoDb.getAndValidateByUserBlid(req.params.id, accessToken.sub).then(
					(docs: SEDocument[]) => {
						this.patchDocument(res, req.params.id, req.body);
					},
					(validateByBlidError: BlError) => {
						if (this.seToken.permissionAbove(accessToken.permission, loginOptions.permissions)) {
							this.patchDocument(res, req.params.id, req.body);
						} else {
							this.resHandler.sendErrorResponse(res, validateByBlidError.add(
								blError
									.msg('could not validate blid')
									.store('accessTokenPayload', accessToken)
									.store('url', url)).code(905));
						}
					});
			} else {
				this.patchDocument(res, req.params.id, req.body);
			}
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