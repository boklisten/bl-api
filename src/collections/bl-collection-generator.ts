

import {BlCollection, BlEndpoint} from "./bl-collection";
import {AccessToken, BlapiResponse, BlDocument, BlError, UserPermission} from "@wizardcoder/bl-model";
import {NextFunction, Request, Response, Router} from "express";
import {ApiPath} from "../config/api-path";
import * as passport from "passport";
import {SEResponseHandler} from "../response/se.response.handler";
import chalk from "chalk";
import {BlDocumentStorage} from "../storage/blDocumentStorage";
import {Hook} from "../hook/hook";
import {PermissionService} from "../auth/permission/permission.service";
import {SEDbQuery} from "../query/se.db-query";
import {SEDbQueryBuilder} from "../query/se.db-query-builder";

export class BlCollectionGenerator<T extends BlDocument>{
	private apiPath: ApiPath;
	private url: string;
	private authStrategy: string;
	private resHandler: SEResponseHandler;
	private documentStorage: BlDocumentStorage<T>;
	private defaultHook: Hook;
	private permissionService: PermissionService;
	
	constructor(private router: Router, private collection: BlCollection) {
		this.apiPath = new ApiPath();
		this.url = this.apiPath.createPath(collection.collectionName);
		this.authStrategy = 'jwt';
		this.resHandler = new SEResponseHandler();
		this.documentStorage = new BlDocumentStorage(collection.collectionName, collection.mongooseSchema);
		this.defaultHook = new Hook();
		this.permissionService = new PermissionService();
	}
	
	public generate() {
		console.log('\t\t' + chalk.dim.green('/' + this.collection.collectionName));
		for (let endpoint of this.collection.endpoints) {
			
			if (!endpoint.hook) {
				endpoint.hook = this.defaultHook; //a default hook that always resolves to true
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
	
	private validateDocPermission(endpoint: BlEndpoint, accessToken: AccessToken, doc: BlDocument): boolean {
		if (endpoint.restriction) {
			return this.permissionService.haveRestrictedPermission(accessToken.sub, accessToken.permission, doc);
		}
		return true;
	}
	
	private genereateGetId(endpoint: BlEndpoint) {
		this.router.get(this.url + '/:id', (req: Request, res: Response, next: NextFunction) => {
			if (endpoint.restriction) {
				passport.authenticate(this.authStrategy, (err, accessToken: {accessToken: AccessToken}, info) => {
					this.validateAuth(endpoint, accessToken.accessToken, err, info).then((accessToken: AccessToken) => {
						
						this.getId(req.params.id, res, endpoint, accessToken);
				
					
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
	
	
	private getId(id: string, res: Response, endpoint?: BlEndpoint, accessToken?: AccessToken) {
		this.documentStorage.get(id).then((doc: T) => {
			
			if (accessToken) {
				if (!this.validateDocPermission(endpoint,  accessToken, doc)) {
					return this.resHandler.sendErrorResponse(res, new BlError(`user "${accessToken.sub}" does not have permission to get document "${id}"`).code(904));
				}
			}
			
			return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
		}).catch((blError: BlError) => {
			return this.resHandler.sendErrorResponse(res, blError);
		});
	}
	
	private getAll(res: Response, query?: SEDbQuery) {
		if (query) {
			this.documentStorage.getByQuery(query).then((docs: T[]) => {
				this.resHandler.sendResponse(res, new BlapiResponse(docs));
			}).catch((blError: BlError) => {
				this.resHandler.sendErrorResponse(res, blError);
			});
		} else {
			this.documentStorage.getAll().then((docs: T[]) => {
				this.resHandler.sendResponse(res, new BlapiResponse(docs));
			}).catch((blError: BlError) => {
				this.resHandler.sendErrorResponse(res, blError);
			});
		}
	}
	
	private generateDelete(endpoint: BlEndpoint) {
		this.router.delete(this.url + '/:id', (req: Request, res: Response, next: NextFunction) => {
			passport.authenticate(this.authStrategy, (err, aToken: {accessToken: AccessToken}, info) => {
				this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
					this.documentStorage.remove(req.params.id, {id: accessToken.sub, permission: accessToken.permission}).then((doc: T) => {
						return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, blError);
					});
				});
			})(req, res, next);
		});
		
		this.printEndpointInfo('delete', '/:id', endpoint);
	}
	
	
	private generateGetAll(endpoint: BlEndpoint) {
		this.router.get(this.url, (req: Request, res: Response, next: NextFunction) => {
			if (endpoint.restriction) { //if user must be logged in to access
				passport.authenticate(this.authStrategy, (err, aToken: { accessToken: AccessToken}, info) => {
					this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
						
						if (req.query && endpoint.validQueryParams) {
							let dbQuery = new SEDbQueryBuilder();
							let query = dbQuery.getDbQuery(req.query, endpoint.validQueryParams);
							this.getAll(res, query);
						} else {
							this.getAll(res);
						}
						
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, blError);
					});
				})(req, res, next);
			} else { //no restriction all users can get this endpoint
				if (req.query && endpoint.validQueryParams) {
					let dbQuery = new SEDbQueryBuilder();
					let query = dbQuery.getDbQuery(req.query, endpoint.validQueryParams);
					this.getAll(res, query);
				} else {
					this.getAll(res);
				}
			}
		});
		
		this.printEndpointInfo('get', '', endpoint);
	}
	
	private generatePatch(endpoint: BlEndpoint) {
		this.router.patch(this.url + '/:id', (req: Request, res: Response, next: NextFunction) => {
			passport.authenticate(this.authStrategy, (err, aToken: {accessToken: AccessToken}, info) => {
				this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
					
					if (!req.body || (Object.keys(req.body).length === 0 && req.body.constructor === Object)) {
						return this.resHandler.sendErrorResponse(res, new BlError('no data provided').code(701));
					}
					
					
					endpoint.hook.before(req.body, accessToken, req.params.id).then(() => {
						this.documentStorage.update(req.params.id, req.body, {id: accessToken.sub, permission: accessToken.permission}).then((doc: T) => {
							
							endpoint.hook.after([doc.id], accessToken).then((returnVal: boolean | T[] | any) => {
								if (Object.prototype.toString.call(returnVal) === '[object Array]'){
									return this.resHandler.sendResponse(res, new BlapiResponse(returnVal));
								}
								
								return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
							}).catch((blError: BlError) => {
								return this.resHandler.sendErrorResponse(res, new BlError('hook.after on patch failed').add(blError).code(701));
							})
							
						}).catch((blError: BlError) => {
							return this.resHandler.sendErrorResponse(res, blError);
						});
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, new BlError('hook.before on patch failed')
							.add(blError)
							.store('body', req.body)
							.store('url', req.url)
							.code(701))
					})
				
				});
			})(req, res, next);
		});
		
		this.printEndpointInfo('patch', '/:id', endpoint);
	}
	
	private generatePost(endpoint: BlEndpoint) {
		this.router.post(this.url, (req: Request, res: Response, next: NextFunction) => {
			passport.authenticate(this.authStrategy, (err, aToken: {accessToken: AccessToken}, info) => {
				this.validateAuth(endpoint, aToken.accessToken, err, info).then((accessToken: AccessToken) => {
					
					if (!req.body || (Object.keys(req.body).length === 0 && req.body.constructor === Object)) {
						return this.resHandler.sendErrorResponse(res, new BlError('no data provided').code(701));
					}
					
					
					endpoint.hook.before(req.body, accessToken).then(() => {
						this.documentStorage.add(req.body, {id: accessToken.sub, permission: accessToken.permission}).then((doc: T) => {
							
							endpoint.hook.after([doc.id], accessToken).then((returnVal: boolean | T[] | any) => {
								
								if (Object.prototype.toString.call(returnVal) === '[object Array]'){
									return this.resHandler.sendResponse(res, new BlapiResponse(returnVal));
								}
								
								return this.resHandler.sendResponse(res, new BlapiResponse([doc]));
							}).catch((blError: BlError) => {
								
								this.documentStorage.remove(doc.id, {id: accessToken.sub, permission: accessToken.permission}).then(() => {
									return this.resHandler.sendErrorResponse(res, new BlError(`hook.after on post failed and the document with id ${doc.id} was deleted`)
										.store('document', doc)
										.add(blError)
										.code(701));
								}).catch((blError: BlError) => {
									return this.resHandler.sendErrorResponse(res, new BlError(`hook.after on post failed, and the document with id ${doc.id} could not be deleted`)
										.store('document', doc)
										.add(blError));
								});
								
							});
						}).catch((blError: BlError) => {
							return this.resHandler.sendErrorResponse(res, blError);
						});
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, new BlError('hook.before on post failed')
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
	
	private printEndpointInfo(method: string, path: string, endpoint: BlEndpoint) {
		let output = '\t\t\t' + chalk.dim.bold.yellow(method.toUpperCase()) + '\t' + chalk.dim.green(path);
		let permissionService: PermissionService = new PermissionService();
		
		output += '\t';
		
		if (endpoint.restriction && endpoint.restriction.permissions) {
			output += chalk.dim.bold.red('[' + permissionService.getLowestPermission(endpoint.restriction.permissions) + '] ');
		} else {
			output += chalk.dim.green('[everyone] ');
		}
		
		output += '\t';
		
		if (endpoint.restriction && endpoint.restriction.restricted) {
			output += chalk.red.dim('user');
		}
		
		output += '\t';
		
		if (endpoint.hook) {
			if (endpoint.hook !== this.defaultHook) {
				output += chalk.dim.gray('<hooked>');
			}
		}
		
		console.log(output);
	}
}