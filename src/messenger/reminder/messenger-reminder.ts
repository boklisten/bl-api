import { BlError, Message, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { CustomerItemHandler } from "../../collections/customer-item/helpers/customer-item-handler";
import { EmailService } from "../email/email-service";
import { userDetailSchema } from "../../collections/user-detail/user-detail.schema";

export class MessengerReminder {
  private customerItemHandler: CustomerItemHandler;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private emailService: EmailService;

  constructor(
    customerItemHandler?: CustomerItemHandler,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    emailService?: EmailService
  ) {
    this.customerItemHandler = customerItemHandler
      ? customerItemHandler
      : new CustomerItemHandler();
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage<UserDetail>("userdetails", userDetailSchema);
    this.emailService = emailService ? emailService : new EmailService();
  }

  /**
   *  Tries to remind all customers to return items that have the specified deadline
   *  @param deadline the deadline the reminder is for
   */
  // eslint-disable-next-line
  public remindAll(deadline: Date) {}

  /**
   *  Reminds a customer to return a item with the specified deadline
   *  @param customerId the customers id
   *  @param deadline the deadline the reminder is for
   *  @param messageId if provided, stores message info in that message object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async remindCustomer(message: Message): Promise<any> {
    if (message.customerId == null || message.customerId.length <= 0) {
      throw new BlError("customerId is null or undefined");
    }

    if (!message.info || message.info["deadline"] == null) {
      throw new BlError("deadline is null or undefined");
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const notReturnedCustomerItems =
        await this.customerItemHandler.getNotReturned(
          message.customerId,
          message.info["deadline"],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message.messageSubtype as any
        );

      const userDetail = await this.userDetailStorage.get(message.customerId);

      await this.emailService.remind(
        message,
        userDetail,
        notReturnedCustomerItems
      );
    } catch (e) {
      throw e;
    }

    return true;
  }
}
