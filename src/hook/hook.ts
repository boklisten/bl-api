

import {IHook} from "./IHook";
import {BlDocument, AccessToken} from "bl-model";

export class Hook implements IHook {
	
	constructor() {}
	
	public before(body?: any, accessToken?: AccessToken): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	public after(ids: string[], accessToken?: AccessToken): Promise<boolean | BlDocument[]> {
		return Promise.resolve(true);
	}
}