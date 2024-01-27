export class RefreshTokenSecret {
  get(): string {
    return (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      process.env.REFRESH_TOKEN_SECRET || "secretly a string is just chars"
    );
  }
}
