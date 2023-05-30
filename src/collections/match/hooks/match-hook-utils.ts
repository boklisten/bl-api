import { CandidateMatch, CandidateMatchVariant } from "../helpers/match-finder-2/match-types";
import { Match, StandMatch, UserMatch } from "@boklisten/bl-model";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const booklistsForBranchAggregation = (branches: string[]) => [{}];

export interface MatcherSpec {
  senderBranches: string[];
  receiverBranches: string[];
  outdatedItems: string[];
}

export async function candidateMatchToMatch(
  candidate: CandidateMatch,
): Promise<Match> {
  const meetingInfo: Match["meetingInfo"] = {
    location: "",
    date: new Date(2025, 12),
  };
  switch (candidate.variant) {
    case CandidateMatchVariant.StandMatch:
      return new StandMatch(
        candidate.userId,
        Array.from(candidate.handoffItems),
        Array.from(candidate.pickupItems),
        meetingInfo
      );
    case CandidateMatchVariant.UserMatch:
      return new UserMatch(
        candidate.senderId,
        candidate.receiverId,
        Array.from(candidate.items),
        meetingInfo
      );
  }
}
