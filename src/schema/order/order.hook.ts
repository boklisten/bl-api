

import {Hook} from "../../hook/hook";
import {HookConfig} from "../../hook/hook.config";
import {BlDocument, BlError, Order} from "bl-model";
import {SEDocument} from "../../db/model/se.document";

export class OrderHook extends Hook {
	
	constructor() {
		const hookConfig: HookConfig = {type: Order};
		
		super(hookConfig);
	}

	
	
	public run(docs: SEDocument[]): Promise<boolean> {
		console.log('hello from OrderHook!', docs);
		//return Promise.resolve(true);
		return Promise.resolve(true);
	}
}