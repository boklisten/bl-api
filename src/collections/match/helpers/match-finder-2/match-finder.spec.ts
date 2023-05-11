import "mocha";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import { MatchFinder } from "./match-finder";
import {
  MatchableUser,
  MatchTypes,
  NewMatch,
  StandDeliveryMatch,
  StandPickupMatch,
  UserMatch,
} from "./match-types";
import { difference, intersect } from "../set-methods";
import ullern_test_users from "./test-data/ullern_test_users.json";
import otto_treider_test_users_year_0 from "./test-data/test_users_year_0.json";
import otto_treider_test_users_year_1 from "./test-data/test_users_year_1.json";
import otto_treider_test_users_year_2 from "./test-data/test_users_year_2.json";

chai.use(chaiAsPromised);
chai.use(sinonChai);

// mulberry32 PRNG: https://stackoverflow.com/a/47593316
function seededRandom(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function calculateNumberOfMatchesPerType(matches: NewMatch[]) {
  return matches.reduce(
    (acc, match) => ({
      standDeliveryMatches:
        acc.standDeliveryMatches +
        (match.type === MatchTypes.StandDeliveryMatch ? 1 : 0),
      standPickupMatches:
        acc.standPickupMatches +
        (match.type === MatchTypes.StandPickupMatch ? 1 : 0),
      userMatches:
        acc.userMatches + (match.type === MatchTypes.UserMatch ? 1 : 0),
    }),
    { standDeliveryMatches: 0, standPickupMatches: 0, userMatches: 0 }
  );
}

function createFakeUserMatch(
  sender: MatchableUser,
  receiver: MatchableUser,
  items: Set<string>
): UserMatch {
  return {
    type: MatchTypes.UserMatch,
    senderId: sender.id,
    receiverId: receiver.id,
    items,
  };
}

function createFakeStandPickupMatch(
  receiver: MatchableUser,
  items: Set<string>
): StandPickupMatch {
  return {
    type: MatchTypes.StandPickupMatch,
    receiverId: receiver.id,
    items,
  };
}

function createFakeStandDeliveryMatch(
  sender: MatchableUser,
  items: Set<string>
): StandDeliveryMatch {
  return {
    type: MatchTypes.StandDeliveryMatch,
    senderId: sender.id,
    items,
  };
}

function createFakeMatchableUser(
  id: string,
  ...items: string[]
): MatchableUser {
  return {
    id,
    items: new Set(items),
  };
}

function createUserGroup(
  idPrefix: string,
  size: number,
  ...items: string[]
): MatchableUser[] {
  return [...Array(size)].map((_, id) =>
    createFakeMatchableUser(idPrefix + id, ...items)
  );
}

function groupMatchesByUser(matches: NewMatch[]) {
  const matchesPerUser: { id: string; matches: NewMatch[] }[] = [];
  for (const match of matches) {
    if ("senderId" in match) {
      const foundSender = matchesPerUser.find(
        (user) => user.id === match.senderId
      );
      if (foundSender) {
        foundSender.matches.push(match);
      } else {
        matchesPerUser.push({ id: match.senderId, matches: [match] });
      }
    }
    if ("receiverId" in match) {
      const foundReceiver = matchesPerUser.find(
        (user) => user.id === match.receiverId
      );
      if (foundReceiver) {
        foundReceiver.matches.push(match);
      } else {
        matchesPerUser.push({ id: match.receiverId, matches: [match] });
      }
    }
  }
  return matchesPerUser.sort((a, b) =>
    a.matches.length > b.matches.length ? -1 : 1
  );
}

// in place shuffle with seed, Fisher-Yates
const shuffler =
  (randomizer: () => number) =>
  <T>(list: T[]): T[] => {
    for (let i = 0; i < list.length; i++) {
      const random = i + Math.floor(randomizer() * (list.length - i));
      const temp = list[random];
      list[random] = list[i]!;
      list[i] = temp!;
    }
    return list;
  };

const andrine = createFakeMatchableUser("andrine", "book1", "book2", "book3");

const beate = createFakeMatchableUser("beate", "book1", "book2", "book3");

const monika = createFakeMatchableUser("monika", "book4");

const mathias = createFakeMatchableUser(
  "mathias",
  "book1",
  "book2",
  "book3",
  "book4"
);

describe("Full User Match", () => {
  it("should be able to full match with other user", () => {
    const matchFinder = new MatchFinder([andrine], [beate], []);
    const matches = matchFinder.generateMatches();
    const expectedMatch = createFakeUserMatch(andrine, beate, andrine.items);
    assert.deepEqual(matches, [expectedMatch]);
  });

  it("should not fully match with non overlapping receivers", () => {
    const matchFinder = new MatchFinder([andrine], [monika], []);
    const matches = matchFinder.generateMatches();
    assert.deepEqual(matches, [
      createFakeStandDeliveryMatch(andrine, andrine.items),
      createFakeStandPickupMatch(monika, monika.items),
    ]);
  });

  it("should full match after removing excessive delivery items", () => {
    const matchFinder = new MatchFinder([mathias], [beate], ["book4"]);
    const matches = matchFinder.generateMatches();

    const expectedUserMatch = createFakeUserMatch(
      mathias,
      beate,
      new Set(["book1", "book2", "book3"])
    );
    const expectedStandMatch = createFakeStandDeliveryMatch(
      mathias,
      new Set(["book4"])
    );
    assert.deepEqual(matches, [expectedStandMatch, expectedUserMatch]);
  });

  it("should create delivery match when all items are set as outdated", () => {
    const matchFinder = new MatchFinder(
      [andrine],
      [beate],
      Array.from(andrine.items)
    );
    const matches = matchFinder.generateMatches();
    // NB: assert.deepEqual cares about the order of items in a set!
    assert.deepEqual(matches, [
      createFakeStandDeliveryMatch(andrine, andrine.items),
      createFakeStandPickupMatch(beate, beate.items),
    ]);
  });

  it("should be able to create multiple full matches with overlapping books", () => {
    const matchFinder = new MatchFinder(
      [monika, mathias],
      [mathias, monika, mathias],
      []
    );
    matchFinder.generateMatches();
    expect(
      Array.from(matchFinder.senders).filter(
        (sender) => sender.items.size !== 0
      ).length
    ).to.equal(0);
    expect(
      Array.from(matchFinder.receivers).filter(
        (receiver) => receiver.items.size !== 0
      ).length
    ).to.equal(0);
  });
});

describe("Partly User Match", () => {
  // should be able to resolve all receiver books by using partly match and delivery match
  // should be able to distribute sender's items over two partly user matches

  it("should create one full match and one partly", () => {
    const matchFinder = new MatchFinder(
      [andrine, mathias],
      [monika, beate],
      []
    );
    const matches = matchFinder.generateMatches();
    const andrineXbeate = createFakeUserMatch(andrine, beate, andrine.items);
    const mathiasXmonika = createFakeUserMatch(
      mathias,
      monika,
      intersect(mathias.items, monika.items)
    );
    const mathiasXstand = createFakeStandDeliveryMatch(
      mathias,
      difference(mathias.items, monika.items)
    );

    assert.deepEqual(matches, [andrineXbeate, mathiasXmonika, mathiasXstand]);
  });

  it("should be able to fully match and partly match a set of ordered users", () => {
    const senderGroupA = createUserGroup("sender-A", 10, "A", "B", "C");
    const senderGroupB = createUserGroup("sender-B", 5, "A");
    const senderGroupC = createUserGroup("sender-C", 5, "B", "C");

    const receiverGroupA = createUserGroup("receiver-A", 10, "A", "B", "C");
    const receiverGroupB = createUserGroup("receiver-B", 5, "A", "B");
    const receiverGroupC = createUserGroup("receiver-C", 5, "C");

    // They match give as follows:
    // A => B
    // B => C
    // C => B, C
    const matchFinder = new MatchFinder(
      [...senderGroupA, ...senderGroupB, ...senderGroupC],
      [...receiverGroupA, ...receiverGroupB, ...receiverGroupC],
      []
    );
    const matches = matchFinder.generateMatches();
    expect(
      Array.from(matchFinder.senders).filter(
        (sender) => sender.items.size !== 0
      ).length
    ).to.equal(0);
    expect(
      Array.from(matchFinder.receivers).filter(
        (receiver) => receiver.items.size !== 0
      ).length
    ).to.equal(0);
    expect(matches.length).to.equal(25);
  });

  it("should be able to fully match and partly match a set of shuffled users", () => {
    const shuffle = shuffler(seededRandom(12345));
    const senderGroupA = createUserGroup("sender-A", 10, "A", "B", "C");
    const senderGroupB = createUserGroup("sender-B", 5, "A");
    const senderGroupC = createUserGroup("sender-C", 5, "B", "C");

    const receiverGroupA = createUserGroup("receiver-A", 10, "A", "B", "C");
    const receiverGroupB = createUserGroup("receiver-B", 5, "A", "B");
    const receiverGroupC = createUserGroup("receiver-C", 5, "C");

    // They match give as follows:
    // A => B
    // B => C
    // C => B, C
    const matchFinder = new MatchFinder(
      shuffle([...senderGroupA, ...senderGroupB, ...senderGroupC]),
      shuffle([...receiverGroupA, ...receiverGroupB, ...receiverGroupC]),
      []
    );
    const matches = matchFinder.generateMatches();
    expect(
      Array.from(matchFinder.senders).filter(
        (sender) => sender.items.size !== 0
      ).length
    ).to.equal(0, "expected number of senders with remaining items to be 0");
    expect(
      Array.from(matchFinder.receivers).filter(
        (receiver) => receiver.items.size !== 0
      ).length
    ).to.equal(0, "expected number of receivers with remaining items to be 0");
    expect(matches.length).to.be.lessThan(
      30,
      "expected reasonable number of matches"
    );
  });

  it("should be able to fully and partly match some ordered users, leaving some receivers craving for more", () => {
    const senderGroupA = createUserGroup("sender-A", 3, "A");
    const senderGroupB = createUserGroup("sender-B", 4, "B");
    const senderGroupC = createUserGroup("sender-C", 5, "A", "B");

    const receiverGroupA = createUserGroup("receiver-A", 10, "A", "B");

    const matchFinder = new MatchFinder(
      [...senderGroupA, ...senderGroupB, ...senderGroupC],
      receiverGroupA,
      []
    );
    const matches = matchFinder.generateMatches();
    expect(
      Array.from(matchFinder.senders).every((sender) => sender.items.size === 0)
    ).to.be.true;

    expect(
      Array.from(matchFinder.receivers).every(
        (receiver) => receiver.items.size === 0
      )
    ).to.be.true;

    // 5 matches made in heaven
    // 3 senderA => receiverA
    // 3 senderB => receiverA
    // 1 senderB => Stand
    // 2 Stand => receiverA
    expect(matches.length).to.equal(14);
  });

  it("should be able to fully and partly match some shuffled users, leaving some receivers craving for more", () => {
    const shuffle = shuffler(seededRandom(12345));
    const senderGroupA = createUserGroup("sender-A", 3, "A");
    const senderGroupB = createUserGroup("sender-B", 4, "B");
    const senderGroupC = createUserGroup("sender-C", 5, "A", "B");

    const receiverGroupA = createUserGroup("receiver-A", 10, "A", "B");

    const matchFinder = new MatchFinder(
      shuffle([...senderGroupA, ...senderGroupB, ...senderGroupC]),
      shuffle(receiverGroupA),
      []
    );
    const matches = matchFinder.generateMatches();
    expect(
      Array.from(matchFinder.senders).every((sender) => sender.items.size === 0)
    ).to.be.true;

    expect(
      Array.from(matchFinder.receivers).every(
        (receiver) => receiver.items.size === 0
      )
    ).to.be.true;

    // 5 matches made in heaven
    // 3 senderA => receiverA
    // 3 senderB => receiverA
    // 1 senderB => Stand
    // 2 Stand => receiverA
    expect(matches.length).to.equal(14);
  });
});

describe("Large User Groups", () => {
  it("can sufficiently match created user groups", () => {
    const shuffle = shuffler(seededRandom(324892));
    const senderGroups = [
      createUserGroup("sender-A", 210, "A", "C", "D"),
      createUserGroup("sender-B", 242, "C", "D", "E"),
      createUserGroup("sender-C", 107, "A", "E", "Z"),
      createUserGroup("sender-D", 90, "A", "B", "E"),
    ];

    const recieverGroups = [
      createUserGroup("receiver-A", 123, "A", "B", "C", "D", "E"),
      createUserGroup("receiver-B", 253, "C", "D", "E"),
      createUserGroup("receiver-C", 517, "A"),
    ];

    const matchFinder = new MatchFinder(
      shuffle(senderGroups.flat()),
      shuffle(recieverGroups.flat()),
      ["Z"]
    );

    const matches = Array.from(matchFinder.generateMatches());

    const numberOfMatchesPerType = calculateNumberOfMatchesPerType(matches);

    expect(numberOfMatchesPerType.userMatches).to.be.lessThan(
      senderGroups.flat().length * 1.5
    );
    expect(numberOfMatchesPerType.standDeliveryMatches).to.be.lessThan(
      senderGroups.flat().length * 0.4
    );
    expect(numberOfMatchesPerType.standPickupMatches).to.be.lessThan(
      recieverGroups.flat().length * 0.3
    );
  });

  it("can sufficiently match realistic user data with itself", () => {
    const shuffle = shuffler(seededRandom(12345));
    const rawData = ullern_test_users;
    const test_users: MatchableUser[] = rawData.map(({ id, items }) => ({
      id,
      items: new Set(items.map((item) => item["$numberLong"])),
    }));

    const matchFinder = new MatchFinder(
      shuffle(test_users.slice()),
      shuffle(test_users.slice()),
      []
    );

    const matches = Array.from(matchFinder.generateMatches());

    const numberOfMatchesPerType = calculateNumberOfMatchesPerType(matches);

    expect(numberOfMatchesPerType.userMatches).to.be.lessThan(
      test_users.length * 1.4
    );
    expect(numberOfMatchesPerType.standDeliveryMatches).to.be.lessThanOrEqual(
      test_users.length * 0.1
    );
    expect(numberOfMatchesPerType.standPickupMatches).to.be.lessThanOrEqual(
      test_users.length * 0.1
    );
  });

  it("can sufficiently match realistic user data with a modified version of itself", () => {
    const shuffle = shuffler(seededRandom(123454332));
    const rawData = ullern_test_users;
    const test_users: MatchableUser[] = rawData.map(({ id, items }) => ({
      id,
      items: new Set(items.map((item) => item["$numberLong"])),
    }));

    const matchFinder = new MatchFinder(
      shuffle(test_users.slice()).slice(33),
      shuffle(test_users.slice()).slice(20),
      []
    );

    const matches = Array.from(matchFinder.generateMatches());

    const numberOfMatchesPerType = calculateNumberOfMatchesPerType(matches);

    expect(numberOfMatchesPerType.userMatches).to.be.lessThan(
      test_users.flat().length * 1.4
    );
    expect(numberOfMatchesPerType.standDeliveryMatches).to.be.lessThanOrEqual(
      test_users.flat().length * 0.2
    );
    expect(numberOfMatchesPerType.standPickupMatches).to.be.lessThanOrEqual(
      test_users.flat().length * 0.2
    );
  });

  it("should have a lot of pickup and deliveries when many new books are introduced", () => {
    const shuffle = shuffler(seededRandom(128738745));
    const testUsersYear1: MatchableUser[] = otto_treider_test_users_year_1.map(
      ({ items, id }) => ({ items: new Set(items), id })
    );
    const testUsersYear2: MatchableUser[] = otto_treider_test_users_year_2.map(
      ({ items, id }) => ({ items: new Set(items), id })
    );

    const matchFinder = new MatchFinder(
      shuffle(testUsersYear1),
      shuffle(testUsersYear2),
      []
    );

    const matches = Array.from(matchFinder.generateMatches());

    const numberOfMatchesPerType = calculateNumberOfMatchesPerType(matches);

    expect(numberOfMatchesPerType.userMatches).to.be.lessThan(
      testUsersYear1.flat().length * 1.1
    );
    expect(numberOfMatchesPerType.standDeliveryMatches).to.be.greaterThan(
      testUsersYear1.length * 0.9
    );
    expect(numberOfMatchesPerType.standPickupMatches).to.be.greaterThan(
      testUsersYear2.length * 0.9
    );
  });

  it("should be able to sufficiently match two different year classes with similar books", () => {
    const shuffle = shuffler(seededRandom(123982));
    const testUsersYear0: MatchableUser[] = otto_treider_test_users_year_0.map(
      ({ items, id }) => ({ items: new Set(items), id })
    );
    const testUsersYear1: MatchableUser[] = otto_treider_test_users_year_1.map(
      ({ items, id }) => ({ items: new Set(items), id })
    );

    const matchFinder = new MatchFinder(
      shuffle(testUsersYear0),
      shuffle(testUsersYear1),
      []
    );

    const matches = Array.from(matchFinder.generateMatches());

    const numberOfMatchesPerType = calculateNumberOfMatchesPerType(matches);

    const standDeliveryItems = matches
      .filter((match) => match.type === MatchTypes.StandDeliveryMatch)
      .flatMap((match) => Array.from(match.items));
    const standPickupItems = matches
      .filter((match) => match.type === MatchTypes.StandPickupMatch)
      .flatMap((match) => Array.from(match.items));

    expect(
      standDeliveryItems.every(
        (deliveryItem) => !standPickupItems.includes(deliveryItem)
      )
    );

    const groupedUsers = groupMatchesByUser(matches);

    if (groupedUsers.length > 0) {
      expect(groupedUsers[0]?.matches.length).to.be.lessThanOrEqual(3);
    }

    expect(numberOfMatchesPerType.userMatches).to.be.lessThan(
      testUsersYear0.length * 1.1
    );
    expect(numberOfMatchesPerType.standDeliveryMatches).to.be.lessThan(
      testUsersYear0.length * 0.4
    );
    expect(numberOfMatchesPerType.standPickupMatches).to.be.lessThan(
      testUsersYear1.length * 0.4
    );
  });
});