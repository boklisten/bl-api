

import {IHook} from "./IHook";
import {BlDocument, AccessToken, BlError} from "@wizardcoder/bl-model";

export class Hook implements IHook {
	
	constructor() {}
	
	public before(body?: any, accessToken?: AccessToken, id?: string): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	public after(docs: BlDocument[], accessToken?: AccessToken): Promise<BlDocument[]> {
		return Promise.resolve((docs) ? docs : []);
	}
}