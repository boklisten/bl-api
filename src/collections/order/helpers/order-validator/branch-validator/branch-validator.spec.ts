// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { BlError, Branch, Item, OrderItem } from "@boklisten/bl-model";
import { BranchValidator } from "./branch-validator";

chai.use(chaiAsPromised);

describe("BranchValidator", () => {
  let testOrderItem: OrderItem;
  let testBranch: Branch;
  const branchValidator: BranchValidator = new BranchValidator();

  beforeEach(() => {
    testOrderItem = {
      title: "signatur 3",
      unitPrice: 200,
      taxRate: 0,
      taxAmount: 0,
      item: "i1",
      amount: 100,
      type: "rent",
    };

    testBranch = {
      id: "branch1",
      name: "Sonans",
      branchItems: [],
      paymentInfo: {
        responsible: false,
        rentPeriods: [
          {
            type: "semester",
            date: new Date(),
            maxNumberOfPeriods: 2,
            percentage: 0.5,
          },
        ],
        extendPeriods: [
          {
            type: "semester",
            price: 100,
            date: new Date(),
            maxNumberOfPeriods: 1,
          },
        ],
        buyout: {
          percentage: 0.5,
        },
        acceptedMethods: ["card"],
      },
    };
  });
});
