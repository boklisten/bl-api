export interface MatchableUser {
  id: string;
  items: Set<string>;
}

export enum MatchTypes {
  UserMatch = "UserMatch",
  StandDeliveryMatch = "StandDeliveryMatch",
  StandPickupMatch = "StandPickupMatch",
}

export interface UserMatch {
  senderId: string;
  receiverId: string;
  items: Set<string>;
  type: MatchTypes.UserMatch;
}

export interface StandDeliveryMatch {
  senderId: string;
  items: Set<string>;
  type: MatchTypes.StandDeliveryMatch;
}

export interface StandPickupMatch {
  receiverId: string;
  items: Set<string>;
  type: MatchTypes.StandPickupMatch;
}

export type NewMatch = StandDeliveryMatch | StandPickupMatch | UserMatch;
