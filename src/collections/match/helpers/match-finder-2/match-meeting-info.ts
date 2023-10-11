import {
  CandidateMatch,
  CandidateMatchVariant,
  CandidateStandMatch,
  CandidateUserMatch,
  MatchLocation,
  MatchWithMeetingInfo,
  StandMatchWithMeetingInfo,
  UserMatchWithMeetingInfo,
} from "./match-types";

const MEETING_DURATION_IN_MS = 60 * 15 * 1000; // 15 minutes

interface SenderWithMatches {
  senderId: string;
  matches: CandidateUserMatch[];
}

/**
 * Create a list of objects, where each object represents a sender, with the matches they are assigned as sender for
 * @param userMatches unassigned UserMatches
 */
function groupMatchesBySender(
  userMatches: CandidateUserMatch[],
): SenderWithMatches[] {
  return userMatches
    .reduce((acc, match) => {
      const foundSender = acc.find(
        (sender) => sender.senderId === match.senderId,
      );
      if (foundSender) {
        foundSender.matches.push(match);
      } else {
        acc.push({ senderId: match.senderId, matches: [match] });
      }
      return acc;
    }, [] as SenderWithMatches[])
    .sort((a, b) => (a.matches.length > b.matches.length ? -1 : 1));
}

/**
 * @param location a location with a corresponding limit towards how many matches can be assigned to that location at a given time
 * @param existingMeetingTimes an ascending list of previous meeting times for the location
 * @param startTime the earliest possible timeslot
 */
function findEarliestLocationTime(
  location: MatchLocation,
  existingMeetingTimes: Date[],
  startTime: Date,
): Date {
  if (
    !location.simultaneousMatchLimit ||
    existingMeetingTimes.length < location.simultaneousMatchLimit
  ) {
    return startTime;
  }
  const prevMeetingTime = existingMeetingTimes?.at(-1);
  const simultaneousMatches = existingMeetingTimes.filter(
    (meetingTime) => meetingTime.getTime() === prevMeetingTime.getTime(),
  );

  if (simultaneousMatches.length < location.simultaneousMatchLimit) {
    return prevMeetingTime;
  }

  return new Date(prevMeetingTime.getTime() + MEETING_DURATION_IN_MS);
}

/**
 * Find the first possible time after the startTime where all the users are available
 * @param users the users to find a timeslot for
 * @param startTime the earliest possible timeslot
 * @param userMeetingTimes an ascending list of previous meeting times for each user
 */
function findEarliestPossibleMeetingTime(
  users: string[],
  startTime: Date,
  userMeetingTimes: { [userId: string]: Date[] },
): Date {
  let earliestPossibleTime = startTime;
  for (const user of users) {
    const prevUserTime = userMeetingTimes[user]?.at(-1);
    if (prevUserTime && prevUserTime >= earliestPossibleTime) {
      earliestPossibleTime = new Date(
        prevUserTime.getTime() + MEETING_DURATION_IN_MS,
      );
    }
  }
  return earliestPossibleTime;
}

/**
 * Verifies that the stand matches has the correct location and no assigned time
 * @param standMatches the updated stand matches
 * @param standLocation the location of the stand
 */
function verifyStandMatches(
  standMatches: StandMatchWithMeetingInfo[],
  standLocation: string,
) {
  if (
    standMatches.some(
      (match) =>
        match.meetingInfo.date !== null ||
        match.meetingInfo.location !== standLocation,
    )
  ) {
    throw new Error(
      "All stand matches must have correct location and no assigned time slot",
    );
  }
}

/**
 * Checks that:
 * - Every input match has a corresponding updated match that has been assigned a time and location
 * - the meeting location is valid and that the meeting time is in the future
 * - no user has two simultaneous meetings at different locations
 * @param userMatches
 * @param userMatchesWithMeetingInfo
 * @param startTime
 * @param userMatchLocations
 */
function verifyUserMatches(
  userMatches: CandidateUserMatch[],
  userMatchesWithMeetingInfo: UserMatchWithMeetingInfo[],
  startTime: Date,
  userMatchLocations: MatchLocation[],
) {
  if (
    userMatches.length !== userMatchesWithMeetingInfo.length ||
    !userMatches.every((userMatch) => {
      const createdMeetingInfoMatch = userMatchesWithMeetingInfo.find(
        (userMatchWithInfo) =>
          userMatch.senderId === userMatchWithInfo.senderId &&
          userMatch.receiverId === userMatchWithInfo.receiverId &&
          userMatch.items === userMatchWithInfo.items,
      );
      if (createdMeetingInfoMatch === undefined) {
        return false;
      }
      return (
        userMatchLocations
          .map((location) => location.name)
          .includes(createdMeetingInfoMatch.meetingInfo.location) &&
        createdMeetingInfoMatch.meetingInfo.date >= startTime
      );
    })
  ) {
    throw new Error(
      "Every user match must have a corresponding match with assigned meeting info",
    );
  }

  for (const userMatchWithMeetingInfo of userMatchesWithMeetingInfo) {
    const crashingSenderMatch = userMatchesWithMeetingInfo.find(
      (match) =>
        match.senderId === userMatchWithMeetingInfo.senderId &&
        match.receiverId !== userMatchWithMeetingInfo.receiverId &&
        match.meetingInfo.date.getTime() ===
          userMatchWithMeetingInfo.meetingInfo.date.getTime() &&
        match.meetingInfo.location !==
          userMatchWithMeetingInfo.meetingInfo.location,
    );
    const crashingReceiverMatch = userMatchesWithMeetingInfo.find(
      (match) =>
        match.receiverId === userMatchWithMeetingInfo.receiverId &&
        match.senderId !== userMatchWithMeetingInfo.senderId &&
        match.meetingInfo.date.getTime() ===
          userMatchWithMeetingInfo.meetingInfo.date.getTime() &&
        match.meetingInfo.location !==
          userMatchWithMeetingInfo.meetingInfo.location,
    );

    if (crashingSenderMatch || crashingReceiverMatch) {
      throw new Error(
        "A sender or receiver has two simultaneous matches at different locations!",
      );
    }
  }
}

/**
 *
 * @param matches matches generated from matchFinder
 * @param standLocation the location of the stand
 * @param userMatchLocations the allowed locations for user matches, optionally with a limit on how many simultaneous matches can fit there
 * @param startTime the first allowed meeting time
 */
function assignMeetingInfoToMatches(
  matches: CandidateMatch[],
  standLocation: string,
  userMatchLocations: MatchLocation[],
  startTime: Date,
): MatchWithMeetingInfo[] {
  const standMatches: CandidateStandMatch[] = matches
    .filter((match) => match.variant === CandidateMatchVariant.StandMatch)
    .map((match) => match as CandidateStandMatch);

  const standMatchesWithMeetingInfo: StandMatchWithMeetingInfo[] =
    standMatches.map((match) => ({
      ...match,
      meetingInfo: {
        location: standLocation,
        date: null,
      },
    }));

  const userMatches: CandidateUserMatch[] = matches
    .filter((match) => match.variant === CandidateMatchVariant.UserMatch)
    .map((match) => match as CandidateUserMatch);

  const sendersWithMatches = groupMatchesBySender(userMatches);

  const userMeetingTimes: { [userId: string]: Date[] } = userMatches.reduce(
    (acc, userMatch) => ({
      ...acc,
      [userMatch.senderId]: [],
      [userMatch.receiverId]: [],
    }),
    {},
  );

  const locationMeetingTimes: { [location: string]: Date[] } =
    userMatchLocations.reduce(
      (acc, location) => ({
        ...acc,
        [location.name]: [],
      }),
      {},
    );

  let locationIndex = 0;
  const userMatchesWithMeetingInfo: UserMatchWithMeetingInfo[] = [];

  for (const senderWithMatches of sendersWithMatches) {
    const location = userMatchLocations[locationIndex];
    locationIndex = (locationIndex + 1) % userMatchLocations.length;

    const earliestLocationTime = findEarliestLocationTime(
      location,
      locationMeetingTimes[location.name],
      startTime,
    );

    const receivers = senderWithMatches.matches.map(
      (match) => match.receiverId,
    );
    const earliestPossibleTime = findEarliestPossibleMeetingTime(
      [senderWithMatches.senderId, ...receivers],
      earliestLocationTime,
      userMeetingTimes,
    );

    userMeetingTimes[senderWithMatches.senderId].push(earliestPossibleTime);
    locationMeetingTimes[location.name].push(earliestPossibleTime);
    for (const match of senderWithMatches.matches) {
      userMeetingTimes[match.receiverId].push(earliestPossibleTime);

      userMatchesWithMeetingInfo.push({
        ...match,
        meetingInfo: {
          location: location.name,
          date: earliestPossibleTime,
        },
      });
    }
  }

  verifyStandMatches(standMatchesWithMeetingInfo, standLocation);
  verifyUserMatches(
    userMatches,
    userMatchesWithMeetingInfo,
    startTime,
    userMatchLocations,
  );

  return [...userMatchesWithMeetingInfo, ...standMatchesWithMeetingInfo];
}

export default assignMeetingInfoToMatches;
