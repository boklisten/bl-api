
import {BlCollection} from "../collections/bl-collection";
import {BlDocument, BlError, UserDetail, UserPermission} from "bl-model";
import {BlStorageHandler} from "./blStorageHandler";
import {MongoDbBlStorageHandler} from "./mongoDb/mongoDb.blStorageHandler";
import {SEDbQuery} from "../query/se.db-query";

export class BlDocumentStorage<T extends BlDocument> implements BlStorageHandler<T> {
	
	private mongoDbHandler: MongoDbBlStorageHandler<T>;
	
	constructor(private collectionName: string, private mongooseSchema?: any) {
		if (mongooseSchema) {
			this.mongoDbHandler = new MongoDbBlStorageHandler(collectionName, mongooseSchema);
		}
	}
	
	get(id: string): Promise<T> {
		return new Promise((resolve, reject) => {
			this.mongoDbHandler.get(id).then((doc: T) => {
				resolve(doc);
			}).catch((blError: BlError) => {
				reject(blError);
			});
		});
	}
	
	getByQuery(dbQuery: SEDbQuery): Promise<T[]> {
		return new Promise((resolve, reject) => {
		    this.mongoDbHandler.getByQuery(dbQuery).then((docs: T[]) => {
		    	resolve(docs);
			}).catch((blError: BlError) => {
		    	reject(blError);
			});
		});
	}
	
	getMany(ids: string[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			this.mongoDbHandler.getMany(ids).then((docs: T[]) => {
				resolve(docs);
			}).catch((blError: BlError) => {
				reject(blError);
			})
		});
	}
	
	getAll(): Promise<T[]> {
		return new Promise((resolve, reject) => {
			this.mongoDbHandler.getAll().then((docs: T[]) => {
				resolve(docs);
			}).catch((blError: BlError) => {
				reject(blError);
			})
		});
	}
	
	add(doc: T, user: {id: string, permission: UserPermission}): Promise<T> {
		return new Promise((resolve, reject) => {
			this.mongoDbHandler.add(doc, user).then((addedDoc: T) => {
				resolve(addedDoc);
			}).catch((blError: BlError) => {
				reject(blError);
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
			this.mongoDbHandler.update(id, data, user).then((updatedDoc: T) => {
				resolve(updatedDoc);
			}).catch((blError: BlError) => {
				reject(blError)
			});
		});
	}
	
	updateMany(docs: {id: string, data: any}[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	remove(id: string, user: {id: string, permission: UserPermission}): Promise<T> {
		return new Promise((resolve, reject) => {
			this.mongoDbHandler.remove(id, user).then((deletedDoc: T) => {
				resolve(deletedDoc);
			}).catch((blError: BlError) => {
				reject(blError);
			});
		});
	}
	
	removeMany(ids: string[]): Promise<T[]> {
		return new Promise((resolve, reject) => {
			reject(new BlError('not implemented'));
		});
	}
	
	exists(id: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
		
		});
	}
}