import { BlDocument } from "@boklisten/bl-model";

export interface IHook {
  before(body?: any): Promise<boolean>;
  after(docs: BlDocument[]): Promise<BlDocument[]>;
}
