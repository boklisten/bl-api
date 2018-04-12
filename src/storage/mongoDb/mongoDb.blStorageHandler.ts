

import {BlDocument, BlError, UserPermission} from "@wizardcoder/bl-model";
import {BlStorageHandler} from "../blStorageHandler";
import {MongooseModelCreator} from "./mongoose-schema-creator";
import {PermissionService} from "../../auth/permission/permission.service";
import {SEDbQuery} from "../../query/se.db-query";
import * as mongoose from 'mongoose';

export class MongoDbBlStorageHandler<T extends BlDocument> implements BlStorageHandler<T>{

	private mongooseModel: any;
	private permissionService: PermissionService;

	constructor(collectionName: string, schema: any) {
		let mongoose = require('mongoose');
		mongoose.Promise = require('bluebird');
		const mongooseModelCreator = new MongooseModelCreator(collectionName, schema);
		this.mongooseModel = mongooseModelCreator.create();
		this.permissionService = new PermissionService();
	}
	
	get(id: string): Promise<T> {
		return new Promise((resolve, reject) => {
		    this.mongooseModel.findOne({_id: id}, (error, doc) => {
				if (error) {
					return reject(this.handleError(new BlError(`error when trying to find document with id "${id}"`), error));
				}
				
				if (doc === null) {
					return reject(new BlError('not found').code(702));
				}

				resolve(doc);
			});
		});
	}
	
	getByQuery(dbQuery: SEDbQuery): Promise<T[]> {
		return new Promise((resolve, reject) => {
		    this.mongooseModel
				.find(dbQuery.getFilter(), dbQuery.getOgFilter())
				.limit(dbQuery.getLimitFilter())
				.skip(dbQuery.getSkipFilter())
				.sort(dbQuery.getSortFilter())
				.exec((error, docs) => {
		    		if (error || docs === null) {
		    			return reject(this.handleError(new BlError(`could not find document by the provided query`), error));
					}
					
					if (docs.length <= 0) {
		    			return reject(new BlError('not found').code(702));
					}
					
					resolve(docs)
		    });
		});
	}
	
	getMany(ids: string[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			const idArr = [];
			
			for (let id of ids) {
				try {
					idArr.push(mongoose.Types.ObjectId(id));
				} catch (e) {
					return Promise.reject(new BlError('id in array is not valid'));
				}
			}
			
			this.mongooseModel.find({'_id': {$in: idArr}}).exec((error, docs) => {
				if (error || docs.length <= 0) {
					return reject(this.handleError(new BlError('error when trying to find document'), error));
				}
				resolve(docs);
			});
		});
	}
	
	getAll(): Promise<T[]> {
		return new Promise((resolve, reject) => {
			this.mongooseModel.find({}, (error, docs) => {
				if (error || docs === null) {
					reject(this.handleError(new BlError('failed to get all documnts'), error));
				}
				
				resolve(docs);
			});
		});
	}
	
	add(doc: T, user?: {id: string, permission: UserPermission}): Promise<T> {
		return new Promise((resolve, reject) => {
			doc.creationTime = new Date();
			doc.lastUpdated = new Date();
			
			
			if (user) {
				doc.user = user;
			}
			
			let newDocument = new this.mongooseModel(doc);

			newDocument.save((error, addedDoc) => {
				if (error) {
					return reject(this.handleError(new BlError('error when trying to add document').data(doc), error));
				}

				resolve(addedDoc);
			});
		});
	}
	
	addMany(docs: T[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	update(id: string, data: any, user: {id: string, permission: UserPermission}): Promise<T> {
		return new Promise((resolve, reject) => {
			this.mongooseModel.findById(id, (error, document) => {
				if (error) {
					return reject(this.handleError(new BlError(`failed to find document with id ${id}`), error));
				}
				
				if (document === null) {
					return reject(new BlError(`could not find document with id "${id}"`).code(702));
				}
			
				if (!this.permissionService.haveRestrictedPermission(user.id, user.permission, document)) {
					return reject(new BlError(`user "${user.id} does not have the right permission to update document "${document.id}"`).store('document', document));
				}
				
				if (data['user']) {
					return reject(new BlError('can not change user restrictions after creation').code(701));
				}

				document.set(data);
				document.set({lastUpdated: new Date()});
				

				document.save((error, updatedDocument) => {
					if (error) {
						return reject(this.handleError(new BlError(`failed to save the document`).store('data', data), error));
					}
					
					resolve(updatedDocument)

				});
			})
		});
	}
	
	updateMany(docs: {id: string, data: any}[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	remove(id: string, user: {id: string, permission: UserPermission}): Promise<T> {
		return new Promise((resolve, reject) => {
			this.mongooseModel.findById(id, (error, doc) => {
				if (error || doc === null) {
					return reject(this.handleError(new BlError(`could not remove document with id "${id}"`), error));
				}
				
				if (!this.permissionService.haveRestrictedPermission(user.id, user.permission, doc)) {
					return reject(new BlError(`user "${user.id}" does not have permission to delete document "${id}"`));
				}
				
				this.mongooseModel.findByIdAndRemove(id, (error, doc) => {
					if (error) {
						return reject(this.handleError(new BlError(`could not remove document with id "${id}"`), error));
					}

					if (doc === null) {
						return reject(new BlError('not found').code(702).store('id', id));
					}
					
					resolve(doc);
				});
			})
		});
	}
	
	removeMany(ids: string[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	exists(id: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
		    this.get(id).then(() => {
		    	resolve(true);
			}).catch(() => {
		    	reject(new BlError(`document with id ${id} does not exist`).code(702));
			});
		});
	}
	
	private handleError(blError: BlError, error: any): BlError {
		
		if (error) {
			if (error.name === 'CastError') {
				return blError.code(702).store('castError', error);
			} else if (error.name == 'ValidationError') {
				return blError.code(701).store('validationError', error);
			} else {
				return blError.code(200);
			}
		} else {
			return new BlError('EndpointMongoDb: unknown error').add(blError).code(200);
		}
	}


}