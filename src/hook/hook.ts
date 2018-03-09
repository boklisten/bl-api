

import {IHook} from "./IHook";
import {HookConfig} from "./hook.config";
import {SEDocument} from "../db/model/se.document";
import {BlDocument, BlError} from "bl-model";

export class Hook implements IHook {
	
	constructor() {}
	
	//deprecated
	public run(docs?: SEDocument[]): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	public before(body?: any): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	public after(ids: string[]): Promise<boolean | BlDocument> {
		return Promise.resolve(true);
	}
}