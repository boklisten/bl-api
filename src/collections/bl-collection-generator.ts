

import {BlCollection, BlEndpoint} from "./bl-collection";
import {AccessToken, BlapiResponse, BlDocument, BlError, UserPermission} from "bl-model";
import {NextFunction, Request, Response, Router} from "express";
import {ApiPath} from "../config/api-path";
import * as passport from "passport";
import {SEResponseHandler} from "../response/se.response.handler";
import chalk from "chalk";

export class BlCollectionGenerator {
	private apiPath: ApiPath;
	private url: string;
	private authStrategy: string;
	private resHandler: SEResponseHandler;
	
	constructor(private router: Router, private collection: BlCollection) {
		this.apiPath = new ApiPath();
		this.url = this.apiPath.createPath(collection.collectionName);
		this.authStrategy = 'jwt';
		this.resHandler = new SEResponseHandler();
	}
	
	public generate() {
		this.generateEndpoints();
	}
	
	private generateEndpoints() {
		console.log('\t' + chalk.blue('# ') + chalk.gray('endpoints:'));
		for (let endpoint of this.collection.endpoints) {
			switch (endpoint.method) {
				case "get":
					this.generateGet(endpoint);
					break;
				case "getId":
					break;
				case "post":
					break;
				case "patch":
					break;
				case "delete":
					break;
				default:
					throw new BlError(`the method ${endpoint.method} is not supported right now`)
			}
		}
	}
	
	private validateAuth(endpoint: BlEndpoint, accessToken: AccessToken, err: any, info: any): boolean {
		if (!accessToken) {
			throw new BlError('accessToken is not found').code(911);
		}
		
		if (endpoint.restriction && endpoint.restriction.permissions) {
			if (endpoint.restriction.permissions.indexOf(accessToken.permission) <= -1) {
				throw new BlError('user lacking the given permission').code(904);
			}
		}
		
		return true;
	}
	
	private generateGet(endpoint: BlEndpoint) {
		this.router.get(this.url, (req: Request, res: Response, next: NextFunction) => {
			if (endpoint.restriction) { //if user must be logged in to access
				passport.authenticate(this.authStrategy, (err, accessToken: { accessToken: AccessToken}, info) => {
					let aToken = accessToken.accessToken;
					try {
						this.validateAuth(endpoint, aToken, err, info);
					} catch (e) {
						if (e instanceof BlError) {
							return this.resHandler.sendErrorResponse(res, e);
						}
						return this.resHandler.sendErrorResponse(res, new BlError('auth failed, unkown error').code(900));
					}
					
					
					console.log('the username', aToken.username);
					console.log('the permission', aToken.permission);
					this.resHandler.sendResponse(res, new BlapiResponse([{success: true}]))
				})(req, res, next);
			} else { //no restriction all users can get this endpoint
			
			}
		});
		
		this.printEndpointInfo(endpoint.method, this.url, endpoint.restriction.permissions);
	}
	
	private printEndpointInfo(method: string, path: string, permissions?: UserPermission[]) {
		let output = '\t\t' + chalk.dim.bold.yellow(method.toUpperCase()) + ' ' + chalk.dim.green(path);
		if (permissions) {
			output += chalk.gray(' [');
			for (let permission of permissions) {
				output += chalk.gray(' ' + permission.toString());
			}
			output += chalk.gray(' ]');
		}
		console.log(output);
	}
	
	private generatePost(endpoint: BlEndpoint) {
		this.router.post(this.url, (req: Request, res: Response, next: NextFunction) => {
			passport.authenticate(this.authStrategy, (err, accessToken: AccessToken, info) => {
			
			})(req, res, next)
		})
	}
}