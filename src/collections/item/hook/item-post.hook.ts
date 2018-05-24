import {Hook} from "../../../hook/hook";
import {AccessToken, Item} from "@wizardcoder/bl-model";


export class ItemPostHook extends Hook {

	constructor() {
		super();
	}

	public before(body: Item, accessToken: AccessToken): Promise<boolean> {
		return Promise.resolve(true);
	}

	public after(items: Item[], accessToken: AccessToken): Promise<Item[]> {
		return Promise.resolve(items);
	}

}