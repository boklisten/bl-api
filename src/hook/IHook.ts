
import {BlDocument} from "@wizardcoder/bl-model";

export interface IHook {
	before(body?: any): Promise<boolean>;
	after(ids: string[]): Promise<boolean | BlDocument[]>
}