
import {SEDocument} from "../db/model/se.document";

export interface IHook {
	run(docs?: SEDocument[]): Promise<boolean>;
}