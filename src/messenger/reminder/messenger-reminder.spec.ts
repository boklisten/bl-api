// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError, UserDetail, Message } from "@boklisten/bl-model";
import { MessengerReminder } from "./messenger-reminder";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { CustomerItem } from "@boklisten/bl-model";
import { SEDbQuery } from "../../query/se.db-query";
import { CustomerItemHandler } from "../../collections/customer-item/helpers/customer-item-handler";
import { EmailService } from "../email/email-service";

chai.use(chaiAsPromised);

describe("MessengerReminder", () => {
  const customerItemStorage = new BlDocumentStorage<CustomerItem>(
    "customerItems"
  );
  const customerItemHandler = new CustomerItemHandler();
  const customerItemStorageGetAllStub = sinon.stub(
    customerItemStorage,
    "getAll"
  );
  const customerItemStorageGetByQueryStub = sinon.stub(
    customerItemStorage,
    "getByQuery"
  );
  const emailService = new EmailService();
  const emailServiceRemindStub = sinon.stub(emailService, "remind");
  const getNotReturnedStub = sinon.stub(customerItemHandler, "getNotReturned");
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");
  const userDetailStorageGetStub = sinon.stub(userDetailStorage, "get");

  const messengerReminder = new MessengerReminder(
    customerItemHandler,
    userDetailStorage,
    emailService
  );

  afterEach(() => {
    customerItemStorageGetAllStub.reset();
    customerItemStorageGetByQueryStub.reset();
    emailServiceRemindStub.reset();
    getNotReturnedStub.reset();
  });

  describe("#remindCustomer", () => {
    it("should throw error if no customerId is provided", (done) => {
      const message = {
        info: {
          deadline: new Date(),
        },
      };

      messengerReminder.remindCustomer(message as Message).catch((err) => {
        expect(err.getMsg()).to.contain("customerId is null or undefined");

        done();
      });
    });

    it("should throw error if deadline is not provided", (done) => {
      const message = {
        customerId: "customer1",
      };

      messengerReminder.remindCustomer(message as Message).catch((err) => {
        expect(err.getMsg()).to.contain("deadline is null or undefined");

        done();
      });
    });

    it("should call customerItemHandler to get not returned customerItems", (done) => {
      getNotReturnedStub.onFirstCall().resolves([]);

      const message = {
        customerId: "customer1",
        info: {
          deadline: new Date(),
        },
      };

      messengerReminder.remindCustomer(message as Message).then(() => {
        expect(getNotReturnedStub).to.be.calledOnce;
        done();
      });
    });

    it("should call emailService.remind with correct arguments", (done) => {
      const customerItems = [
        {
          id: "customerItem1",
          deadline: new Date(2018, 0, 1),
          title: "",
        },
      ];

      const customerDetail: UserDetail = {
        id: "customer1",
        name: "albert",
        address: "Abc 123",
        email: "some@email.com",
        phone: "123",
        branch: "branch1",
        postCode: "0123",
        postCity: "oslo",
        country: "norway",
        dob: new Date(),
      };

      const textBlocks = [
        {
          text: "Hi there, this is a textblock",
        },
      ];

      getNotReturnedStub.resolves(customerItems);
      userDetailStorageGetStub.resolves(customerDetail);
      emailServiceRemindStub.resolves(true);

      const message = {
        id: "message1",
        customerId: "customer1",
        info: {
          deadline: new Date(),
        },
        textBlocks: textBlocks,
      };

      messengerReminder
        .remindCustomer(message as Message)
        .then(() => {
          expect(emailServiceRemindStub).calledWith(
            message,
            customerDetail,
            customerItems
          );
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
