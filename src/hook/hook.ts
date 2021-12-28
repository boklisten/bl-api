import { IHook } from "./IHook";
import { BlDocument, AccessToken } from "@boklisten/bl-model";

export class Hook implements IHook {
  constructor() {}

  public before(
    body?: any,
    accessToken?: AccessToken,
    id?: string,
    query?: any
  ): Promise<boolean | any> {
    return Promise.resolve(true);
  }

  public after(
    docs: BlDocument[],
    accessToken?: AccessToken
  ): Promise<BlDocument[]> {
    return Promise.resolve(docs ? docs : []);
  }
}
