// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, CustomerItem } from "@boklisten/bl-model";
import { CustomerItemValidator } from "./customer-item-validator";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";

chai.use(chaiAsPromised);

describe("CustomerItemValidator", () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    BlCollectionName.CustomerItems
  );
  const customerItemValidator = new CustomerItemValidator(customerItemStorage);

  let testCustomerItem: CustomerItem;

  beforeEach(() => {
    testCustomerItem = {
      id: "customerItem1",
      item: "item1",
      deadline: new Date(),
      handout: true,
      customer: "customer1",
      handoutInfo: {
        handoutBy: "branch",
        handoutById: "branch1",
        handoutEmployee: "employee1",
        time: new Date(),
      },
      returned: false,
    };
  });

  it("should reject if sent customerItem is undefined", () => {
    return expect(customerItemValidator.validate(undefined)).to.be.rejectedWith(
      BlError,
      /customerItem is undefined/
    );
  });
});
