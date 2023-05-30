export interface MatchableUser {
  id: string;
  items: Set<string>;
}

export enum CandidateMatchVariant {
  UserMatch = "UserMatch",
  StandMatch = "StandMatch",
}

export interface CandidateUserMatch {
  senderId: string;
  receiverId: string;
  items: Set<string>;
  variant: CandidateMatchVariant.UserMatch;
}

export interface CandidateStandMatch {
  userId: string;
  handoffItems: Set<string>;
  pickupItems: Set<string>;
  variant: CandidateMatchVariant.StandMatch;
}

export type CandidateMatch = CandidateStandMatch | CandidateUserMatch;
