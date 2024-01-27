export class AccessTokenSecret {
  public get(): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return process.env.ACCESS_TOKEN_SECRET || "hello this is dog";
  }
}
