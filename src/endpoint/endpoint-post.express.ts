
import {SEResponseHandler} from "../response/se.response.handler";
import {EndpointMongodb} from "./endpoint.mongodb";
import {Request, Response, Router} from "express";
import {Method} from "./endpoint.express";
import * as passport from "passport";
import {BlapiResponse, BlError} from 'bl-model';
import {SEDocument} from "../db/model/se.document";
import {AccessToken} from "../auth/token/access-token/access-token";
import {Hook} from "../hook/hook";

export class EndpointPostExpress {
	private resHandler: SEResponseHandler;
	private endpointMongoDb: EndpointMongodb;

	constructor(resHandler: SEResponseHandler, endpointMongoDb: EndpointMongodb) {
		this.resHandler = resHandler;
		this.endpointMongoDb = endpointMongoDb;
	}

	public createPostEndpoint(router: Router, method: Method, url: string, collectionName: string) {
		if (method.login && method.loginOptions) {
			this.createLoginPost(router, url, collectionName, method);
		}
	}

	private createLoginPost(router: Router, url: string, collectionName: string,  method: Method) {
		router.post(url, (req: Request, res: Response, next) => {
			passport.authenticate('jwt', (err, user, info) => {
				if (!user || err || !user.accessToken) {
					return this.resHandler.sendAuthErrorResponse(res, info, err);
				}
				
				const accessToken: AccessToken = user.accessToken;
				
				if (!accessToken) return this.resHandler.sendErrorResponse(res, new BlError('accessToken not found')
					.code(905)
					.store('url', url));
				
				this.endpointMongoDb.post(new SEDocument(collectionName, req.body)).then(
					(docs: SEDocument[]) => {
						this.handleResponse(res, docs, method.hook);
					},
					(postError: BlError) => {
						this.resHandler.sendErrorResponse(res, new BlError('could not post document')
							.store('url', url)
							.store('body', req.body)
							.add(postError)
							.code(700));
					});
			})(req, res, next);
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
