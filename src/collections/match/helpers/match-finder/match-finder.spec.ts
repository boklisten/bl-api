// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import moment from "moment-timezone";
import { BlError, Match, MatchItem, MatchProfile } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import sinonChai from "sinon-chai";
import { dateService } from "../../../../blc/date.service";
import { MatchFinder } from "./match-finder";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const matchStorage = new BlDocumentStorage<Match>("matches");
const matchGetAllStub = sinon.stub(matchStorage, "getAll");
const matchFinder = new MatchFinder(matchStorage);

//const deliveryStorage = new BlDocumentStorage<Delivery>('deliveries');
//const matcher = new Matcher(deliveryStorage);
//const deliveryGetStub = sinon.stub(deliveryStorage, 'get');

describe("find()", () => {
  it("should reject if no match is found", () => {
    const matches = [
      {
        state: "created",
        items: [
          {
            item: "abc1",
          },
        ],
      },
    ] as Match[];

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{ item: "someItem" }] as MatchItem[];

    return expect(matchFinder.find(matchItems)).to.eventually.be.rejectedWith(
      BlError,
      /no match found/
    );
  });

  it('should reject if no match is found to be of type "created" or "partly-matched"', () => {
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

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{ item: "abc1" }] as MatchItem[];

    return expect(matchFinder.find(matchItems)).to.eventually.be.rejectedWith(
      BlError,
      /no match with valid state found/
    );
  });

  it("should resolve with a match if full match is found", () => {
    const matches = [
      {
        state: "created",
        items: [
          {
            item: "item1",
          },
        ],
      },
    ] as Match[];

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{ item: "item1" }] as MatchItem[];

    return expect(matchFinder.find(matchItems)).to.eventually.be.fulfilled;
  });

  it("should resolve with a match if partly match is found", () => {
    const matches = [
      {
        state: "partly-matched",
        items: [
          {
            item: "item1",
            reciever: "reciever1",
          },
          {
            item: "item2",
          },
        ],
      },
      {
        state: "done",
        items: [
          {
            item: "item5",
            reciever: "reciever1",
          },
        ],
      },
    ] as Match[];

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{ item: "item2" }] as MatchItem[];

    return expect(matchFinder.find(matchItems)).to.eventually.deep.equal(
      matches[0]
    );
  });

  it("should reject if no Match is valid for a match", () => {
    const matches = [
      {
        state: "partly-matched",
        items: [
          {
            item: "item1",
            reciever: "reciever1",
          },
          {
            item: "item2",
            reciever: "reciever1",
          },
          {
            item: "item5",
          },
        ],
      },

      {
        state: "created",
        items: [
          {
            item: "item5",
          },
        ],
      },
    ] as Match[];

    matchGetAllStub.withArgs().resolves(matches);

    const matchItems = [{ item: "item2" }] as MatchItem[];

    return matchFinder
      .find(matchItems)
      .should.be.rejectedWith(BlError, /no match found/);
  });
});
