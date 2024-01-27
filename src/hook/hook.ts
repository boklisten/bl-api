/* eslint-disable @typescript-eslint/no-unused-vars */
import { BlDocument, AccessToken } from "@boklisten/bl-model";

import { IHook } from "./IHook";

export class Hook implements IHook {
  public before(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    accessToken?: AccessToken,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    id?: string,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query?: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<boolean | any> {
    return Promise.resolve(true);
  }

  public after(
    docs: BlDocument[],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    accessToken?: AccessToken,
  ): Promise<BlDocument[]> {
    return Promise.resolve(docs ? docs : []);
  }
}
