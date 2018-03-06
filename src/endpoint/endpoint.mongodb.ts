import {SESchema} from "../config/schema/se.schema";
import {SEDocument} from "../db/model/se.document";
import {SEDbQuery} from "../query/se.db-query";
import {BlError} from "bl-model";
import * as mongoose from "mongoose";


export class EndpointMongodb {
	schema: SESchema;

	constructor(schema: SESchema) {
		this.schema = schema;
		let mongoose = require('mongoose');
		mongoose.Promise = require('bluebird');
	}

	public get(dbQuery: SEDbQuery): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel
				.find(dbQuery.getFilter(), dbQuery.getOgFilter())
				.limit(dbQuery.getLimitFilter())
				.skip(dbQuery.getSkipFilter())
				.sort(dbQuery.getSortFilter())
				.exec((error, docs) => {

					if (error) {
						return reject(this.handleError(new BlError('error when trying to get schema')
							.className('EndpointMongoDb')
							.methodName('get'), error));
					}

					let sdocs: SEDocument[] = [];

					for (let doc of docs) {
						sdocs.push(new SEDocument(this.schema.title, doc));
					}

					if (sdocs.length == 0) {
						return reject(new BlError('not found')
							.code(702)
							.className('EndpointMongoDb')
							.methodName('get')
							.store('dbQuery', dbQuery));
					}
					
					resolve(sdocs);
				})
		});
	}
	
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
