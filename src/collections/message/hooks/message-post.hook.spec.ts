import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { AccessToken, BlError, Message, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import sinonChai from "sinon-chai";
import { MessagePostHook } from "./message-post.hook";
import { MessengerReminder } from "../../../messenger/reminder/messenger-reminder";
import { Messenger } from "../../../messenger/messenger";
import { BlCollectionName } from "../../bl-collection";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("MessagePostHook", () => {
  const messengerReminder = new MessengerReminder();
  const userDetailStorage = new BlDocumentStorage<UserDetail>(
    BlCollectionName.UserDetails,
  );
  const messenger = new Messenger();
  const messagePostHook = new MessagePostHook(
    messengerReminder,
    messenger,
    userDetailStorage,
  );
  const messengerSendStub = sinon.stub(messenger, "send");

  const messengerReminderRemindCustomerStub = sinon.stub(
    messengerReminder,
    "remindCustomer",
  );

  const userDetailGetStub = sinon.stub(userDetailStorage, "get");

  describe("#before", () => {
    it("should reject with permission error if permission is not admin or above", () => {
      const accessToken = {
        permission: "customer",
      } as AccessToken;

      const body: Message = {
        id: "",
        customerId: "customer1",
        messageType: "reminder",
        messageSubtype: "none",
        messageMethod: "all",
        info: {
          deadline: new Date(),
        },
      };

      messengerReminderRemindCustomerStub.resolves();

      return expect(
        messagePostHook.before(body, accessToken),
      ).to.eventually.be.rejectedWith(BlError, /no permission/);
    });
  });

  describe("#after", () => {
    beforeEach(() => {
      messengerReminderRemindCustomerStub.reset();
    });

    it("should reject if no messages was provided", () => {
      return expect(messagePostHook.after([]))
        .to.eventually.be.rejectedWith(/no messages provided/)
        .and.be.an.instanceOf(BlError);
    });

    context('when messageType is "reminder"', () => {
      let message: Message;

      beforeEach(() => {
        message = {
          id: "message1",
          customerId: "customer1",
          messageType: "reminder",
          messageSubtype: "none",
          messageMethod: "email",
          info: {
            deadline: new Date(),
          },
        };
      });

      it("should reject if messengerReminder rejects", () => {
        messengerReminderRemindCustomerStub.rejects(
          new BlError("something failed"),
        );

        expect(messagePostHook.after([message])).to.eventually.be.rejectedWith(
          BlError,
        );
      });

      it("should call messengerReminder", (done) => {
        messengerReminderRemindCustomerStub.resolves();

        messagePostHook
          .after([message])
          .then(() => {
            expect(messengerReminderRemindCustomerStub).to.have.been.called;

            const args = messengerReminderRemindCustomerStub.lastCall;

            expect(args).to.be.calledWith(message);

            done();
          })
          .catch((err) => {
            done(err);
          });
      });
    });

    context('when messageType is "generic"', () => {
      let message: Message;
      let userDetail: UserDetail;

      beforeEach(() => {
        message = {
          id: "message1",
          customerId: "customer1",
          messageType: "generic",
          messageSubtype: "none",
          messageMethod: "email",
        };

        userDetail = {
          id: "user1",
          name: "albert",
          email: "test@boklisten.co",
        } as UserDetail;
      });

      it("should call messenger.send", (done) => {
        messengerSendStub.resolves();
        userDetailGetStub.resolves(userDetail);

        messagePostHook
          .after([message])
          .then(() => {
            expect(messengerSendStub).to.have.been.called;

            const args = messengerSendStub.lastCall;

            expect(args).to.be.calledWith(message, userDetail);

            done();
          })
          .catch((err) => {
            done(err);
          });
      });
    });
  });
});
