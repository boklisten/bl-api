

import {IHook} from "./IHook";
import {BlDocument} from "bl-model";

export class Hook implements IHook {
	
	constructor() {}
	
	public before(body?: any): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	public after(ids: string[]): Promise<boolean | BlDocument[]> {
		return Promise.resolve(true);
	}
}