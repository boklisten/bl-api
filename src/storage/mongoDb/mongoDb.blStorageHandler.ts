

import {BlDocument, BlError, UserPermission} from "@wizardcoder/bl-model";
import {BlStorageHandler} from "../blStorageHandler";
import {MongooseModelCreator} from "./mongoose-schema-creator";
import {PermissionService} from "../../auth/permission/permission.service";
import {SEDbQuery} from "../../query/se.db-query";
import { NestedDocument } from "../nested-document";
import { ExpandFilter } from "../../query/expand-filter/db-query-expand-filter";
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

	public get(id: string, userPermission?: UserPermission, nestedDocuments?: NestedDocument[]): Promise<T> {
		return new Promise((resolve, reject) => {
			let filter: any = {_id: id};

		    this.mongooseModel.findOne(filter, (error, doc) => {

				if (error) {
					return reject(this.handleError(new BlError(`error when trying to find document with id "${id}"`), error));
				}

				if (doc === null) {
					return reject(new BlError(`object "${id}" not found`).code(702));
        }

        resolve(doc);
			});
		});
	}
	
	public getByQuery(dbQuery: SEDbQuery, nestedDocuments?: NestedDocument[]): Promise<T[]> {
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

          const expandFilters = dbQuery.getExpandFilter();

          if (nestedDocuments && nestedDocuments.length > 0) {
            this.retrieveNestedDocuments(docs, nestedDocuments, expandFilters).then((docsWithNestedDocuments: T[]) => {
              resolve(docsWithNestedDocuments);
            }).catch((e) => {
              reject(e);
            });
          } else {
            resolve(docs)
          }
		    });
		});
	}
	
	public getMany(ids: string[], userPermission?: UserPermission, nestedDocuments?: NestedDocument[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			const idArr = [];
			
			for (let id of ids) {
				try {
					idArr.push(mongoose.Types.ObjectId(id));
				} catch (e) {
					return Promise.reject(new BlError('id in array is not valid'));
				}
			}

			let filter: any = {_id: {$in: idArr}, active: true};

			if (userPermission && this.permissionService.isAdmin(userPermission)) {
				filter = {_id: {$id: idArr}}; // if user have admin privileges, he can also get documents that are inactive
			}

			this.mongooseModel.find(filter).exec((error, docs) => {
				if (error || docs.length <= 0) {
					return reject(this.handleError(new BlError('error when trying to find document'), error));
        }

        if (nestedDocuments && nestedDocuments.length > 0) {
          this.retrieveNestedDocuments(docs, nestedDocuments, [], userPermission).then((docsWithNestedDocuments: T[]) => {
            resolve(docsWithNestedDocuments);
          }).catch((e) => {
            reject(e);
          });
        } else {
          resolve(docs)
        }
			});
		});
	}
	
	public getAll(userPermission?: UserPermission, nestedDocuments?: NestedDocument[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			let filter: any = {active: true};

			if (userPermission && this.permissionService.isAdmin(userPermission)) {
				filter = {}; // if user have admin privileges, he can also get documents that are inactive
			}

			this.mongooseModel.find(filter, (error, docs) => {
				if (error || docs === null) {
					reject(this.handleError(new BlError('failed to get all documnts'), error));
        }

        if (nestedDocuments && nestedDocuments.length > 0) {
          this.retrieveNestedDocuments(docs, nestedDocuments, [], userPermission).then((docsWithNestedDocuments: T[]) => {
            resolve(docsWithNestedDocuments);
          }).catch((e) => {
            reject(e);
          });
        } else {
          resolve(docs)
        }			
			});
		});
	}
	
	public add(doc: T, user?: {id: string, permission: UserPermission}): Promise<T> {
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
	
	public addMany(docs: T[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	public update(id: string, data: any, user: {id: string, permission: UserPermission}): Promise<T> {
		return new Promise((resolve, reject) => {
			this.mongooseModel.findById(id, (error, document) => {
				if (error) {
					return reject(this.handleError(new BlError(`failed to find document with id ${id}`), error));
				}
				
				if (document === null) {
					return reject(new BlError(`could not find document with id "${id}"`).code(702));
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
	
	public updateMany(docs: {id: string, data: any}[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	public remove(id: string, user: {id: string, permission: UserPermission}): Promise<T> {
		return new Promise((resolve, reject) => {
			this.mongooseModel.findById(id, (error, doc) => {
				if (error || doc === null) {
					return reject(this.handleError(new BlError(`could not remove document with id "${id}"`), error));
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
	
	public removeMany(ids: string[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	public exists(id: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
		    this.get(id).then(() => {
		    	resolve(true);
			}).catch(() => {
		    	reject(new BlError(`document with id ${id} does not exist`).code(702));
			});
		});
  }
  /**
   * Tries to fetch all nested values on the specified documents
   * @param {BlDocument[]} docs the documents to search through
   * @param {NestedDocument[]} nestedDocuments the values to fetch
   * @param {UserPermission} userPermission
   */
  private async retrieveNestedDocuments(docs: BlDocument[], nestedDocuments: NestedDocument[], expandFilters?: ExpandFilter[], userPermission?: UserPermission): Promise<BlDocument[]> {
    const promiseArr: Promise<BlDocument>[] = [];

    if (expandFilters && expandFilters.length > 0) {
      let expandedNestedDocuments = [];

      for (let expandFilter of expandFilters) {
        for (let nestedDocument of nestedDocuments) {
          if (expandFilter.fieldName === nestedDocument.field) {
            expandedNestedDocuments.push(nestedDocument);
          }
        }
      }

      nestedDocuments = expandedNestedDocuments;
    }

    
    for (let doc of docs) {
      promiseArr.push(this.getNestedDocuments(doc, nestedDocuments, userPermission));
    }

    try {
      const docsWithExpandedDocs = await Promise.all(promiseArr);
      return docsWithExpandedDocs;
    } catch (e) {
      throw new BlError('could not retrieve nested documents').code(702).add(e);
    }
  }


  private async getNestedDocuments(doc: BlDocument, nestedDocuments: NestedDocument[], userPermission?: UserPermission): Promise<any> {
    const nestedDocumentsPromArray: Promise<any>[] = [];

    for (const nestedDocument of nestedDocuments) {
      if (doc && doc[nestedDocument.field]) {
        nestedDocumentsPromArray.push(this.getNestedDocument(doc[nestedDocument.field], nestedDocument, userPermission));
      }
    }

    try {
      const nestedDocs = await Promise.all(nestedDocumentsPromArray);      
      
      for (let i = 0; i < nestedDocuments.length; i++) {
        doc[nestedDocuments[i].field] = nestedDocs[i];
      }

      return doc;
    } catch (nestedDocumentError) {
      return doc;
    }
  }

  private getNestedDocument(id: string, nestedDocument: NestedDocument, userPermission?: UserPermission): Promise<any> {
    const documentStorage = new MongoDbBlStorageHandler(nestedDocument.collection, nestedDocument.mongooseSchema);
    return documentStorage.get(id, userPermission);
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
