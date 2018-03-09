
import {BlCollection} from "../collections/bl-collection";
import {BlDocument, BlError} from "bl-model";

export class BlDocumentStorage<T extends BlDocument> {
	
	constructor(private mongooseSchema?: any) {
	
	}
	
	get(id: string): Promise<T> {
		return new Promise((resolve, reject) => {
		    reject(new BlError('not implemented'));
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
			reject(new BlError('not implemented'));
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