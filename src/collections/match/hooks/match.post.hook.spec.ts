// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import {
  AccessToken,
  BlError,
  Match,
  CustomerItem,
  Message,
  UserDetail,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import sinonChai from "sinon-chai";
import { MatchPostHook } from "./match.post.hook";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const customerItemStorage = new BlDocumentStorage<CustomerItem>(
  BlCollectionName.CustomerItems
);

const matchStorage = new BlDocumentStorage<Match>(BlCollectionName.Matches);

const customerItemGetStub = sinon.stub(customerItemStorage, "get");
const customerItemUpdateStub = sinon.stub(customerItemStorage, "update");

const matchPostHook = new MatchPostHook(customerItemStorage, matchStorage);

describe("#before()", () => {
  /*
  it("should reject if Match.sender.userId is not equal to accessToken.details", () => {
    const accessToken = {
      details: "userDetails1",
    } as AccessToken;

    const match = {
      sender: {
        userId: "someOtherUserId",
      },
    } as Match;

    return expect(
      matchPostHook.before(match, accessToken)
    ).to.eventually.be.rejectedWith(
      BlError,
      /Match.sender.userId does not match accessToken.details/
    );
  });

  it("should reject if one of the customerItems already has a match attached", () => {
    const accessToken = {
      details: "userDetails1",
    } as AccessToken;

    const match = {
      sender: {
        userId: "userDetails1",
      },
      items: [
        {
          customerItem: "customerItem1",
        },
        {
          customerItem: "customerItem2",
        },
      ],
    } as Match;

    customerItemGetStub
      .withArgs("customerItem1")
      .resolves({ deadline: new Date() });

    customerItemGetStub.withArgs("customerItem2").resolves({
      deadline: new Date(),
      match: true,
      matchInfo: { time: new Date() },
    });

    return expect(
      matchPostHook.before(match, accessToken)
    ).to.eventually.be.rejectedWith(
      BlError,
      /customerItem "customerItem2" already has a match attached/
    );
  });

  it("should resolve if match is valid", () => {
    const accessToken = {
      details: "userDetails1",
    } as AccessToken;

    const match = {
      sender: {
        userId: "userDetails1",
      },
      items: [
        {
          customerItem: "customerItem1",
        },
        {
          customerItem: "customerItem2",
        },
      ],
    } as Match;

    customerItemGetStub
      .withArgs("customerItem1")
      .resolves({ deadline: new Date() });

    customerItemGetStub.withArgs("customerItem2").resolves({
      deadline: new Date(),
    });

    return expect(matchPostHook.before(match, accessToken)).to.eventually.be
      .true;
  });

   */
});

describe("#after()", () => {
  it("should update all customerItems from Match.items with match details", (done) => {
    const accessToken = {
      details: "userDetails1",
      permission: "customer",
    } as AccessToken;

    const match = {
      id: "match11",
      sender: {
        userId: "userDetails1",
      },
      items: [
        {
          customerItem: "customerItem1",
        },
      ],
    } as Match;

    matchPostHook
      .after([match], accessToken)
      .then(() => {
        const args = customerItemUpdateStub.lastCall.args;

        expect(args[0]).equal("customerItem1");
        expect(args[1].matchInfo.id).equal("match11");
        expect(args[1].match).true;
        expect(typeof args[1].matchInfo.time).equal("object");
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it("should reject if customerItem could not be updated", () => {
    const accessToken = {
      details: "userDetails1",
      permission: "customer",
    } as AccessToken;

    const match = {
      id: "match11",
      sender: {
        userId: "userDetails1",
      },
      items: [
        {
          customerItem: "customerItem16",
        },
      ],
    } as Match;

    customerItemUpdateStub.rejects(new BlError("could not be updated"));

    return expect(
      matchPostHook.after([match], accessToken)
    ).to.eventually.be.rejectedWith(
      BlError,
      /could not update customerItem "customerItem16" with match data/
    );
  });
});
