

import {IHook} from "./IHook";
import {HookConfig} from "./hook.config";
import {SEDocument} from "../db/model/se.document";

export class Hook implements IHook {
	
	constructor() {}
	
	public run(docs?: SEDocument[]): Promise<boolean> {
		return Promise.reject(new Error('method is not implemented'));
	}
}