

import {IHook} from "./IHook";
import {HookConfig} from "./hook.config";

export class Hook implements IHook {
	private _hookConfig: HookConfig;
	
	constructor(hookConfig: HookConfig) {
		this._hookConfig = hookConfig;
	}
	
	public run(docs?: any[], req?: any): Promise<boolean> {
		return Promise.reject(new Error('method is not implemented'));
	}
	
	public handleRequest(): boolean {
		if (this._hookConfig.handleRequest) return true;
		return false;
	}
}