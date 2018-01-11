

import {IHook} from "./IHook";
import {HookConfig} from "./hook.config";

export class Hook implements IHook {
	private _hookConfig: HookConfig;
	
	constructor(hookConfig: HookConfig) {
		this._hookConfig = hookConfig;
	}
	
	run(err: any, next?: IHook, req?: any, res?: any) {
		throw new Error('Hook: Run method needs to be implemented');
	}
}