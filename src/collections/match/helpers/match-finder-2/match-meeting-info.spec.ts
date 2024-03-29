import "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import { MatchFinder } from "./match-finder";
import {
  createFakeMatchableUser,
  createUserGroup,
  seededRandom,
  shuffler,
} from "./match-testing-utils";
import assignMeetingInfoToMatches from "./match-meeting-info";
import { MatchableUser, MatchWithMeetingInfo } from "./match-types";
import otto_treider_test_users_year_0 from "./test-data/test_users_year_0.json";
import otto_treider_test_users_year_1 from "./test-data/test_users_year_1.json";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const audun = createFakeMatchableUser("audun", "Bulkeboka", "Sykling 2");
const siri = createFakeMatchableUser("siri", "Mykhetens leksikon", "Sykling 2");
const kristine = createFakeMatchableUser(
  "kristine",
  "Mykhetens leksikon",
  "Spirituell Spire",
);
const elRi = createFakeMatchableUser("elRi", "Spirituell Spire");

/**
 * Prints data about how many matches each location has at each timeslot
 * @param matches matches that have been assigned a location and a timeslot
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function printLocationMetrics(matches: MatchWithMeetingInfo[]) {
  const aggregatedLocationInfo = matches // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .sort((a, b) => (a.meetingInfo.date > b.meetingInfo.date ? 1 : -1))
    .reduce((acc, match) => {
      const { location, date } = match.meetingInfo;
      return {
        ...acc,
        [location]: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...acc[location],
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          count:
            // @ts-ignore
            acc[location]?.count === undefined ? 1 : acc[location].count + 1,
          [String(date)]:
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            acc[location]?.[String(date)] === undefined
              ? 1
              : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                acc[location][String(date)] + 1,
        },
      };
    }, {});
  console.log(aggregatedLocationInfo);
}

describe("Simple Matches", () => {
  it("should be able to assign non overlapping time a simple match setup", () => {
    const matchFinder = new MatchFinder([audun, kristine], [siri, elRi]);
    const matches = matchFinder.generateMatches();
    const standLocation = "Resepsjonen";
    // Fails if match verification throws an error
    assignMeetingInfoToMatches(
      matches,
      standLocation,
      [{ name: "Sal 1" }, { name: "Sal 2" }],
      new Date("2023-02-02T12:00:00+0100"),
    );
  });

  it("should not be able to be more matches than the location limit at a given time", () => {
    const senders = createUserGroup("sender", 10, "A", "B", "C");
    const receivers = createUserGroup("receiver", 10, "A", "B", "C");
    const matchFinder = new MatchFinder(senders, receivers);
    const matches = matchFinder.generateMatches();
    const standLocation = "Resepsjonen";
    const simultaneousMatchLimit = 2;
    // Fails if match verification throws an error
    const updatedMatches = assignMeetingInfoToMatches(
      matches,
      standLocation,
      [{ name: "Sal 1", simultaneousMatchLimit }, { name: "Sal 2" }],
      new Date("2023-02-02T12:00:00+0100"),
    );
    const meetingTimes = updatedMatches
      .filter((match) => match.meetingInfo.location === "Sal 1")
      .map((match) => match.meetingInfo.date);

    const distinctMeetingTimes = Array.from(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      new Set(meetingTimes.map((d) => d.getTime())),
    ).map((t) => new Date(t));

    for (const distinctMeetingTime of distinctMeetingTimes) {
      const simultaneousMatches = meetingTimes.filter(
        (meetingTime) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          meetingTime.getTime() === distinctMeetingTime.getTime(),
      ).length;

      expect(simultaneousMatches).to.be.lessThanOrEqual(simultaneousMatchLimit);
    }
  });
});

describe("Large User Groups", () => {
  it("should be able to assign non overlapping time with the Otto Treider test data", () => {
    const shuffle = shuffler(seededRandom(123982));
    const testUsersYear0: MatchableUser[] = otto_treider_test_users_year_0.map(
      ({ items, id }) => ({ items: new Set(items), id }),
    );
    const testUsersYear1: MatchableUser[] = otto_treider_test_users_year_1.map(
      ({ items, id }) => ({ items: new Set(items), id }),
    );

    const matchFinder = new MatchFinder(
      shuffle(testUsersYear0),
      shuffle(testUsersYear1),
    );

    const matches = matchFinder.generateMatches();
    const standLocation = "Resepsjonen";
    // Fails if match verification throws an error
    assignMeetingInfoToMatches(
      matches,
      standLocation,
      [
        { name: "Hovedinngangen", simultaneousMatchLimit: 15 },
        { name: "Kantina", simultaneousMatchLimit: 20 },
        { name: "Fysikk-labben", simultaneousMatchLimit: 5 },
      ],
      new Date("2023-02-02T12:00:00+0100"),
    );
  });
});
