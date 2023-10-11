/* eslint-disable @typescript-eslint/no-unused-vars */
import { IHook } from "./IHook";
import { BlDocument, AccessToken } from "@boklisten/bl-model";

export class Hook implements IHook {
  public before(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    accessToken?: AccessToken,
    id?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query?: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<boolean | any> {
    return Promise.resolve(true);
  }

  public after(
    docs: BlDocument[],
    accessToken?: AccessToken,
  ): Promise<BlDocument[]> {
    return Promise.resolve(docs ? docs : []);
  }
}
