

import {Hook} from "../hook";
import {HookConfig} from "../hook.config";

export class OrderHook extends Hook {
	
	constructor(hookConfig: HookConfig) {
		super(hookConfig);
	}
	
	public run(docs: any[]): Promise<boolean> {
		console.log('hello from OrderHook!');
		return Promise.resolve(true);
	}
}