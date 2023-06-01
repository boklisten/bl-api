export interface MatchableUser {
  id: string;
  items: Set<string>;
}

export enum MatchTypes {
  UserMatch = "UserMatch",
  StandMatch = "StandMatch",
}

export interface UserMatch {
  senderId: string;
  receiverId: string;
  items: Set<string>;
  type: MatchTypes.UserMatch;
}

export interface StandMatch {
  userId: string;
  handoffItems: Set<string>;
  pickupItems: Set<string>;
  type: MatchTypes.StandMatch;
}

export type NewMatch = StandMatch | UserMatch;
