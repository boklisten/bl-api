import {JwtPayload, SEToken} from "../auth/token/se.token";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {Request, Response, Router} from "express";
import {LoginOption, Method} from "./endpoint.express";
import * as passport from "passport";
import {BlapiResponse, BlError} from 'bl-model';
import {SEDocument} from "../db/model/se.document";
import {AccessToken} from "../auth/token/access-token/access-token";
import {Hook} from "../hook/hook";

export class EndpointPatchExpress {
	private seToken: SEToken;
	private enpointMongoDb: EndpointMongodb;
	private resHandler: SEResponseHandler;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.enpointMongoDb = endpointMongoDb;
		this.seToken = new SEToken();
	}

	public createPatchEndpoint(router: Router, method: Method, url: string) {
		if (method.login && method.loginOptions) {
			this.createLoginPatch(router, url, method);
		}
	}

	private createLoginPatch(router: Router, url: string, method: Method) {
		router.patch(url, passport.authenticate('jwt'), (req: Request, res: Response) => {
			const accessToken: AccessToken = req.user.accessToken;
			if (!accessToken) return this.resHandler.sendErrorResponse(res,
				new BlError('accessToken not found')
					.store('url', url)
					.code(905));
			
			if (method.loginOptions.restrictedToUserOrAbove) {
				this.enpointMongoDb.getAndValidateByUserBlid(req.params.id, accessToken.sub).then(
					(docs: SEDocument[]) => {
						this.patchDocument(res, req.params.id, new SEDocument(this.enpointMongoDb.schema.title, req.body), method.hook);
					},
					(validateByBlidError: BlError) => {
						if (this.seToken.permissionAbove(accessToken.permission, method.loginOptions.permissions)) {
							this.patchDocument(res, req.params.id, new SEDocument(this.enpointMongoDb.schema.title, req.body), method.hook);
						} else {
							this.resHandler.sendErrorResponse(res, new BlError('could not validate blid')
								.store('accessTokenPayload', accessToken)
								.store('url', url)
								.code(905)
								.add(validateByBlidError));
						}
					});
			} else {
				this.patchDocument(res, req.params.id, new SEDocument(this.enpointMongoDb.schema.title, req.body), method.hook);
			}
		});
	}

	private patchDocument(res: Response, id: string, body: SEDocument, hook?: Hook) {
		this.enpointMongoDb.patch(id, body).then(
			(docs: SEDocument[]) => {
				this.handleResponse(res, docs, hook);
			},
			(patchError: BlError) => {
				this.resHandler.sendErrorResponse(res, new BlError('could not patch document')
					.className('EndpointPatchExpress')
					.methodName('patchDocument')
					.add(patchError));
			});
	}
	
	private handleResponse(res: any, docs: SEDocument[], hook?: Hook) {
		if (hook) {
			hook.run(docs).then(() => {
				this.resHandler.sendResponse(res, new BlapiResponse(docs));
			}).catch((hookError: BlError) => {
				this.resHandler.sendErrorResponse(res, new BlError('hook failed').add(hookError).code(800));
			});
		} else {
			this.resHandler.sendResponse(res, new BlapiResponse(docs));
		}
	}

}