import { BlDocument } from "@boklisten/bl-model";

export interface IHook {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  before(body?: any): Promise<boolean>;
  after(docs: BlDocument[]): Promise<BlDocument[]>;
}
