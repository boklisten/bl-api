import { AccessToken, Item } from "@boklisten/bl-model";

export class ItemPatchHook {
  before(body: any, accessToken: AccessToken, id: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  after(items: Item[], accessToken: AccessToken): Promise<Item[]> {
    return Promise.resolve(items);
  }
}
