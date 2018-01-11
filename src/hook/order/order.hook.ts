

import {Hook} from "../hook";
import {HookConfig} from "../hook.config";
import {BlError} from "bl-model";

export class OrderHook extends Hook {
	
	constructor(hookConfig: HookConfig) {
		super(hookConfig);
	}
	
	public run(docs: any[]): Promise<boolean> {
		console.log('hello from OrderHook!', docs);
		//return Promise.resolve(true);
		return Promise.reject(new BlError('dont work...'));
	}
}