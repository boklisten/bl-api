

import {BlDocument, UserPermission} from "bl-model";

export interface BlStorageHandler<T extends BlDocument> {
	
	get(id: string): Promise<T>;
	
	getMany(ids: string[]): Promise<T[]>;
	
	getByQuery(query: any): Promise<T[]>;
	
	getAll(): Promise<T[]>;
	
	add(doc: T, user: {id: string, permission: UserPermission}): Promise<T>;
	
	addMany(docs: T[]): Promise<T[]>;
	
	update(id: string, data: any, user: {id: string, permission: UserPermission}): Promise<T>;
	
	updateMany(docs: { id: string, data: any }[]): Promise<T[]>;
	
	remove(id: string, user: {id: string, permission: UserPermission}): Promise<T>;
	
	removeMany(ids: string[]): Promise<T[]>;
	
	exists(id: string): Promise<boolean>;
}
