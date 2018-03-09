

import {SESchema} from "../../config/schema/se.schema";
import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";
import {BlDocument, BlError} from "bl-model";
import * as mongoose from "mongoose";
import {BlStorageHandler} from "../blStorageHandler";
import {MongooseModelCreator} from "./mongoose-schema-creator";

export class MongoDbBlStorageHandler<T extends BlDocument> implements BlStorageHandler<T>{

	private mongooseModel: any;

	constructor(collectionName: string, schema: any) {
		let mongoose = require('mongoose');
		mongoose.Promise = require('bluebird');
		const mongooseModelCreator = new MongooseModelCreator(collectionName, schema);
		this.mongooseModel = mongooseModelCreator.create();
	}
	
	get(id: string): Promise<T> {
		return new Promise((resolve, reject) => {
		    this.mongooseModel.findOne({_id: id}, (error, doc) => {
				if (error) {
					reject(this.handleError(new BlError(`error when trying to find document with id "${id}"`), error));
				}
				
				if (doc === null) {
					reject(new BlError('not found').code(702));
					return;
				}

				resolve(doc);
			});
		});
	}
	
	getMany(ids: string[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	getAll(): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	add(doc: T): Promise<T> {
		return new Promise((resolve, reject) => {
			doc.creationTime = new Date();
			
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
	
	update(id: string, data: any): Promise<T> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	updateMany(docs: {id: string, data: any}[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	remove(id: string): Promise<T> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	removeMany(ids: string[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	/*
	
	public getManyById(ids: string[]): Promise<SEDocument[]> {
		const idArr = [];
		
		for (let id of ids) {
			try {
				idArr.push(mongoose.Types.ObjectId(id));
			} catch (e) {
				return Promise.reject(new BlError('id in array is not valid'));
			}
		}
		
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel.find({'_id': {$in: idArr}}).exec((error, docs) => {
				if (error || docs.length <= 0) return reject(this.handleError(new BlError('error when trying to find document'), error));
				
				let sdocs: SEDocument[] = [];
				
				for (let doc of docs) {
					sdocs.push(new SEDocument(this.schema.title, doc));
				}
				
				resolve(sdocs);
			});
		});
	}

	public exists(dbQuery: SEDbQuery): Promise<boolean> {
		return new Promise((resolve, reject) => {
		    this.schema.mongooseModel
			    .find(dbQuery.getFilter(), dbQuery.getOgFilter())
			    .exec((error, docs) => {
		    		let blError = new BlError('').className('EndpointMongoDb').methodName('exists');
		    	    if (error || docs.length <= 0) {
		    	    	reject(blError
							.msg('error when trying to find schema or object not found')
							.data(error)
							.store('dbQuery', dbQuery)
							.code(702));
			        }
		    	    resolve(true);
			    });
		});
	}

	public post(document: SEDocument): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			document.data.creationTime = new Date().toISOString();
			let newDocument = new this.schema.mongooseModel(document.data);
			

			newDocument.save((error, doc) => {
				if (error) {
					console.log('the error', error);
					return reject(this.handleError(new BlError('error when trying to save document')
						.data(document)
						.methodName('post')
						.className('EndpointMongoDb'), error));
				}

				resolve([new SEDocument(this.schema.title, doc)]);
			});
		});
	}

	public getById(id: string): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel.findOne({_id: id}, (error, doc) => {
				let blError = new BlError('').className('EndpointMongoDb').methodName('getById');
				if (error) {
					reject(this.handleError(blError.msg('error when trying to find document with id "' + id + '"'), error));
				}
				
				if (doc === null) {
					reject(blError.msg('not found').code(702));
					return;
				}

				resolve([new SEDocument(this.schema.title, doc)]);
			});
		});
	}

	public put(): Promise<SEDocument> {
		return Promise.reject('')
	}
	
	public patch(id: string, doc: SEDocument): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel.findById(id, (error, document) => {
				let blError = new BlError('').className('EndpointMongoDb').methodName('patch');
				if (error) {
					return reject(this.handleError(blError.msg('failed to find document by id "' + id + '"'), error));
				}

				if (document === null) {
					return reject(blError.msg('could not find document with id "' + id +'"').code(702));
				}

				document.set(doc.data);
				document.set({lastUpdated: new Date().toISOString()});

				document.save((error, updatedDocument) => {
					if (error) {
						reject(this.handleError(blError.msg('failed to save the document').data(doc), error));
						return;
					}

					resolve([new SEDocument(this.schema.title, updatedDocument)]);
				});
			})
		});
	}

	public deleteById(id: string): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel.findByIdAndRemove(id, (error, doc) => {
				let blError = new BlError('').className('EndpointMongoDb').methodName('deleteById');
				if (error) {
					return reject(this.handleError(blError.msg('could not findByIdAndRemove, the id was "' + id + '"'), error));
				}

				if (doc === null) {
					return reject(blError.msg('not found').code(702).data(id));
				}
				resolve([new SEDocument(this.schema.title, doc)]);
			});
		});
	}

	public getAndValidateByUserBlid(objId: string, blid: string): Promise<SEDocument[]> {
		
		return new Promise((resolve, reject) => {
			this.getById(objId).then(
				(docs: SEDocument[]) => {
					let data = docs[0].data;

					if (data.user) {
						if (data.user.id) {
							if (data.user.id === blid) {
								return resolve(docs);
							}
						}
					}
					reject(new BlError('the user is not valid, the objId was "' + objId + '"').data(blid));
				},
				(error: BlError) => {
					reject(new BlError('failed to getById "' + objId + '"').add(error));
				});
		});
	}
	
	*/
	

	
	
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