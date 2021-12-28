import { Hook } from "../../../hook/hook";
import { AccessToken, Item } from "@boklisten/bl-model";

export class ItemPostHook extends Hook {
  constructor() {
    super();
  }

  public override before(
    body: Item,
    accessToken: AccessToken
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  public override after(
    items: Item[],
    accessToken: AccessToken
  ): Promise<Item[]> {
    return Promise.resolve(items);
  }
}
