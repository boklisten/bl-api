

import {Hook} from "../hook";
import {HookConfig} from "../hook.config";

export class OrderHook extends Hook {
	
	constructor(hookConfig: HookConfig) {
		super(hookConfig);
	}
	
	public run(next: any) {
		console.log('hello from OrderHook!');
		next();
	}
}