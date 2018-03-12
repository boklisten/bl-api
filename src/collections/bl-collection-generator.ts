

import {BlCollection, BlEndpoint} from "./bl-collection";
import {AccessToken, BlapiResponse, BlDocument, BlError, UserPermission} from "bl-model";
import {NextFunction, Request, Response, Router} from "express";
import {ApiPath} from "../config/api-path";
import * as passport from "passport";
import {SEResponseHandler} from "../response/se.response.handler";
import chalk from "chalk";
import {BlDocumentStorage} from "../storage/blDocumentStorage";
import {Hook} from "../hook/hook";

export class BlCollectionGenerator<T extends BlDocument>{
	private apiPath: ApiPath;
	private url: string;
	private authStrategy: string;
	private resHandler: SEResponseHandler;
	private documentStorage: BlDocumentStorage<T>;
	
	constructor(private router: Router, private collection: BlCollection) {
		this.apiPath = new ApiPath();
		this.url = this.apiPath.createPath(collection.collectionName);
		this.authStrategy = 'jwt';
		this.resHandler = new SEResponseHandler();
		this.documentStorage = new BlDocumentStorage(collection.collectionName, collection.mongooseSchema);
		
	}
	
	public generate() {
		this.generateEndpoints();
	}
	
	private generateEndpoints() {
		console.log('\t\t' + chalk.dim.green('/' + this.collection.collectionName));
		for (let endpoint of this.collection.endpoints) {
			
			if (!endpoint.hook) {
				endpoint.hook = new Hook(); //a default hook that always resolves to true
			}
			
			
			switch (endpoint.method) {
				case "getAll":
					this.generateGetAll(endpoint);
					break;
				case "getId":
					this.genereateGetId(endpoint);
					break;
				case "post":
					this.generatePost(endpoint);
					break;
				case "patch":
					this.generatePatch(endpoint);
					break;
				case "delete":
					this.generateDelete(endpoint);
					break;
				default:
					throw new BlError(`the method ${endpoint.method} is not supported right now`)
			}
		}
	}
	
	private validateAuth(endpoint: BlEndpoint, accessToken: AccessToken, err: any, info: any): Promise<AccessToken>{
		return new Promise((resolve, reject) => {
			
			if (!accessToken) {
				reject(new BlError('accessToken is not found').code(911));
			}
			
			if (endpoint.restriction && endpoint.restriction.permissions) {
				if (endpoint.restriction.permissions.indexOf(accessToken.permission) <= -1) {
					reject(new BlError('user lacking the given permission').code(904));
				}
			}
			
			resolve(accessToken);
		});
	}
	
	private genereateGetId(endpoint: BlEndpoint) {
		this.router.get(this.url + '/:id', (req: Request, res: Response, next: NextFunction) => {
			if (endpoint.restriction) {
				passport.authenticate(this.authStrategy, (err, accessToken: {accessToken: AccessToken}, info) => {
					this.validateAuth(endpoint, accessToken.accessToken, err, info).then((accessToken: AccessToken) => {
						
						this.getId(req.params.id, res);
				
					
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, blError);
					});
				})(req, res, next);
			} else {
				this.getId(req.params.id, res);
			}
		});
		
		this.printEndpointInfo('get', '/:id', endpoint);
	}
	
	private generatePatch(endpoint: BlEndpoint) {
		this.router.patch(this.url + '/:id', (req: Request, res: Response, next: NextFunction) => {
			passport.authenticate(this.authStrategy, (err, aToken: {accessToken: AccessToken}, info) => {
				this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
					
					if (!req.body || (Object.keys(req.body).length === 0 && req.body.constructor === Object)) {
						return this.resHandler.sendErrorResponse(res, new BlError('no data provided').code(701));
					}
					
					this.documentStorage.update(req.params.id, req.body).then((doc: T) => {
						return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, blError);
					});
				
				});
			})(req, res, next);
		});
		
		this.printEndpointInfo('patch', '/:id', endpoint);
	}
	
	private getId(id: string, res: Response) {
		this.documentStorage.get(id).then((doc: T) => {
			return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
		}).catch((blError: BlError) => {
			return this.resHandler.sendErrorResponse(res, blError);
		});
	}
	
	private generateGetAll(endpoint: BlEndpoint) {
		this.router.get(this.url, (req: Request, res: Response, next: NextFunction) => {
			if (endpoint.restriction) { //if user must be logged in to access
				passport.authenticate(this.authStrategy, (err, aToken: { accessToken: AccessToken}, info) => {
					this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
						
						this.getAll(res);
						
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, blError);
					});
				})(req, res, next);
			} else { //no restriction all users can get this endpoint
				this.getAll(res);
			}
		});
		
		this.printEndpointInfo('get', '', endpoint);
	}
	
	private getAll(res: Response) {
		this.documentStorage.getAll().then((docs: T[]) => {
			this.resHandler.sendResponse(res, new BlapiResponse(docs));
		}).catch((blError: BlError) => {
			this.resHandler.sendErrorResponse(res, blError);
		});
	}
	
	private printEndpointInfo(method: string, path: string, endpoint: BlEndpoint) {
		let output = '\t\t\t' + chalk.dim.bold.yellow(method.toUpperCase()) + '\t' + chalk.dim.green(path);
		if (endpoint.restriction && endpoint.restriction.permissions) {
			output += chalk.gray('\t[');
			for (let permission of endpoint.restriction.permissions) {
				output += chalk.gray(' ' + permission.toString());
			}
			output += chalk.gray(' ]');
		} else {
			output += chalk.gray('\t[ everyone ]');
		}
		console.log(output);
	}
	
	private generateDelete(endpoint: BlEndpoint) {
		this.router.delete(this.url + '/:id', (req: Request, res: Response, next: NextFunction) => {
			passport.authenticate(this.authStrategy, (err, aToken: {accessToken: AccessToken}, info) => {
				this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
					this.documentStorage.remove(req.params.id).then((doc: T) => {
						return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, blError);
					});
				});
			})(req, res, next);
		});
		
		this.printEndpointInfo('delete', '/:id', endpoint);
	}
	
	private generatePost(endpoint: BlEndpoint) {
		this.router.post(this.url, (req: Request, res: Response, next: NextFunction) => {
			passport.authenticate(this.authStrategy, (err, aToken: {accessToken: AccessToken}, info) => {
				this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
					
					if (!req.body || (Object.keys(req.body).length === 0 && req.body.constructor === Object)) {
						return this.resHandler.sendErrorResponse(res, new BlError('no data provided').code(701));
					}
					
					
					endpoint.hook.before(req.body).then(() => {
						this.documentStorage.add(req.body).then((doc: T) => {
							
							endpoint.hook.after([doc.id]).then((returnVal: boolean | T) => {
								
								if (returnVal !== true){
									return this.resHandler.sendResponse(res, new BlapiResponse([returnVal]));
								}
								
								return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
							}).catch((blError: BlError) => {
								
								this.documentStorage.remove(doc.id).then(() => {
									return this.resHandler.sendErrorResponse(res, new BlError(`hook.after failed and the document with id ${doc.id} was deleted`)
										.store('document', doc)
										.add(blError)
										.code(701));
								}).catch((blError: BlError) => {
									return this.resHandler.sendErrorResponse(res, new BlError(`hook.after failed, and the document with id ${doc.id} could not be deleted`)
										.store('document', doc)
										.add(blError));
								});
								
							});
						}).catch((blError: BlError) => {
							return this.resHandler.sendErrorResponse(res, blError);
						});
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, new BlError('hook.before failed')
							.add(blError)
							.store('document', req.body)
							.code(701));
					});
				}).catch((blError: BlError) => {
					return this.resHandler.sendErrorResponse(res, blError);
				});
			})(req, res, next)
		});
		
		this.printEndpointInfo('post', '', endpoint);
	}
}