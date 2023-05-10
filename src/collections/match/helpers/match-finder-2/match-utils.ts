import { MatchableUser } from "./matchTypes";

export function copyUsers(users: MatchableUser[]): Set<MatchableUser> {
  return new Set(
    users
      .map(({ id, items }) => ({
        id,
        items: new Set(items),
      }))
      .sort((a, b) => (a.items.size > b.items.size ? -1 : 1))
  );
}
