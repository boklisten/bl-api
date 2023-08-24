import { Hook } from "../../../hook/hook";

export class UserDetailUpdateHook extends Hook {
  private cleanUserInput = (dirtyText: string): string => {
    return dirtyText
      .replace(/\s+/gu, " ")
      .trim()
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  public override async before(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any
  ): Promise<boolean> {
    if (body.name) {
      body.name = this.cleanUserInput(body.name);
    }

    if (body.address) {
      body.address = this.cleanUserInput(body.address);
    }

    if (body.postCity) {
      body.postCity = this.cleanUserInput(body.postCity);
    }

    return true;
  }
}
