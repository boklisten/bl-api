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
import { MessageHelper } from "../helper/message-helper";
import { Messenger } from "../../../messenger/messenger";
import { BlCollectionName } from "../../bl-collection";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("MessagePostHook", () => {
  const messengerReminder = new MessengerReminder();
  const messageStorage = new BlDocumentStorage<Message>(
    BlCollectionName.Messages,
  );
  const userDetailStorage = new BlDocumentStorage<UserDetail>(
    BlCollectionName.UserDetails,
  );
  const messageHelper = new MessageHelper(messageStorage);
  const messenger = new Messenger();
  const messagePostHook = new MessagePostHook(
    messengerReminder,
    messageStorage,
    messageHelper,
    messenger,
    userDetailStorage,
  );
  const messengerSendStub = sinon.stub(messenger, "send");

  const messengerReminderRemindCustomerStub = sinon.stub(
    messengerReminder,
    "remindCustomer",
  );

  const userDetailGetStub = sinon.stub(userDetailStorage, "get");

  const messageHelperIsAddedStub = sinon.stub(messageHelper, "isAdded");

  messageHelperIsAddedStub.resolves(false);

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

      messengerReminderRemindCustomerStub.resolves(true);

      return expect(
        messagePostHook.before(body, accessToken),
      ).to.eventually.be.rejectedWith(BlError, /no permission/);
    });

    /*
    it('should reject if message is already added', () => {
      const accessToken = {
        permission: 'admin',
      } as AccessToken;

      const body: Message = {
        id: '',
        customerId: 'customer1',
        messageType: 'reminder',
        messageSubtype: 'none',
        messageMethod: 'all',
        info: {
          deadline: new Date(),
        },
      };

      messengerReminderRemindCustomerStub.resolves(true);
      messageHelperIsAddedStub.resolves(true);

      return expect(
        messagePostHook.before(body, accessToken),
      ).to.eventually.be.rejectedWith(BlError, /already added/);
    });

  */
  });

  describe("#after", () => {
    beforeEach(() => {
      messengerReminderRemindCustomerStub.reset();
    });

    it("should reject if no messages was provided", () => {
      return expect(messagePostHook.after([], {} as AccessToken))
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

        expect(
          messagePostHook.after([message], {} as AccessToken),
        ).to.eventually.be.rejectedWith(BlError);
      });

      it("should call messengerReminder", (done) => {
        messengerReminderRemindCustomerStub.resolves(true);

        messagePostHook
          .after([message], {} as AccessToken)
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
        messengerSendStub.resolves(true);
        userDetailGetStub.resolves(userDetail);

        messagePostHook
          .after([message], {} as AccessToken)
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
