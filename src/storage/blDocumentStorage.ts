
import {BlCollection} from "../collections/bl-collection";
import {BlDocument, BlError} from "bl-model";
import {BlStorageHandler} from "./blStorageHandler";
import {MongoDbBlStorageHandler} from "./mongoDb/mongoDb.blStorageHandler";

export class BlDocumentStorage<T extends BlDocument> implements BlStorageHandler<T> {
	
	private mongoDbHandler: MongoDbBlStorageHandler<T>;
	
	constructor(private collectionName: string, private mongooseSchema?: any) {
		this.mongoDbHandler = new MongoDbBlStorageHandler(collectionName, mongooseSchema);
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
			this.mongoDbHandler.add(doc).then((addedDoc: T) => {
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
}