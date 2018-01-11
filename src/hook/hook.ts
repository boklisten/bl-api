

import {IHook} from "./IHook";
import {HookConfig} from "./hook.config";

export class Hook implements IHook {
	private _hookConfig: HookConfig;
	
	constructor(hookConfig: HookConfig) {
		this._hookConfig = hookConfig;
	}
	
	public run(docs?: any[]): Promise<boolean> {
		return Promise.reject(new Error('method is not implemented'));
	}
}