export class AccessTokenSecret {
  public get(): string {
    return process.env.ACCESS_TOKEN_SECRET || "hello this is dog";
  }
}
