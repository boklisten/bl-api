

import {BlDocument} from "bl-model";

export interface BlStorageHandler<T extends BlDocument> {
	
	get(id: string): Promise<T>;
	
	getMany(ids: string[]): Promise<T[]>;
	
	getAll(): Promise<T[]>;
	
	add(doc: T): Promise<T>;
	
	addMany(docs: T[]): Promise<T[]>;
	
	update(id: string, data: any): Promise<T>;
	
	updateMany(docs: { id: string, data: any }[]): Promise<T[]>;
	
	remove(id: string): Promise<T>;
	
	removeMany(ids: string[]): Promise<T[]>;
	
	exists(id: string): Promise<boolean>;
}
