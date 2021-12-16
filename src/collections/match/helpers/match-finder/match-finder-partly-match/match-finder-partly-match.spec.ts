// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, Match, MatchItem } from "@boklisten/bl-model";
import sinonChai from "sinon-chai";
import { dateService } from "../../../../../blc/date.service";
import { MatchFinderPartlyMatch } from "./match-finder-partly-match";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const matchFinderPartlyMatch = new MatchFinderPartlyMatch();

describe("find()", () => {
  it("should reject if no partly match is found", () => {
    const matches = [
      {
        state: "done",
        items: [
          {
            item: "abc1",
          },
        ],
      },
    ] as Match[];

    const matchItems = [{ item: "someItem" }] as MatchItem[];

    return expect(
      matchFinderPartlyMatch.find(matchItems, matches)
    ).to.eventually.be.rejectedWith(BlError, /no match was found/);
  });

  it("should resolve with correct match", () => {
    const matches = [
      {
        state: "created",
        items: [
          {
            item: "item1",
          },
          {
            item: "item2",
          },
        ],
      },
    ] as Match[];

    const matchItems = [{ item: "item1" }] as MatchItem[];

    return matchFinderPartlyMatch
      .find(matchItems, matches)
      .should.eventually.deep.equal(matches[0]);
  });
});
