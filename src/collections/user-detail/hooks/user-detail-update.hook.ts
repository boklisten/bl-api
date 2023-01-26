import { Hook } from "../../../hook/hook";

export class UserDetailUpdateHook extends Hook {
  private cleanUserInput = (dirtyText: string): string => {
    const withoutSpaces = dirtyText.replace(/\s+/gu, " ").trim();

    // Do not fix capitalization if the string contains Norwegian characters
    // They are bothersome when it comes to word boundaries...
    if (withoutSpaces.toLowerCase().match(/[øæåä]/)) {
      return withoutSpaces;
    }

    return withoutSpaces
      .toLowerCase()
      .replace(/\b\w/gu, (c) => c.toUpperCase());
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
