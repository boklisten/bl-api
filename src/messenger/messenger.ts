import {
  Delivery,
  Order,
  UserDetail,
  CustomerItem,
  Message,
} from "@boklisten/bl-model";

import { EmailService } from "./email/email-service";
import {
  MessengerService,
  CustomerDetailWithCustomerItem,
} from "./messenger-service";
import { PdfService } from "./pdf/pdf-service";
import { BlCollectionName } from "../collections/bl-collection";
import { deliverySchema } from "../collections/delivery/delivery.schema";
import { BlDocumentStorage } from "../storage/blDocumentStorage";

export class Messenger implements MessengerService {
  private _emailService: EmailService;
  private _pdfService: PdfService;
  private _deliveryStorage: BlDocumentStorage<Delivery>;

  constructor() {
    this._emailService = new EmailService();
    this._deliveryStorage = new BlDocumentStorage<Delivery>(
      BlCollectionName.Deliveries,
      deliverySchema,
    );
    this._pdfService = new PdfService();
  }

  /**
   * send out message(s) to the customer
   * @param {Message[]} messages
   * @param {UserDetail} customerDetail
   */
  public send(message: Message, customerDetail: UserDetail) {
    this._emailService.send(message, customerDetail);
  }

  /**
   * send out message(s) to the customer
   * @param {Message[]} messages
   * @param {UserDetail[]} customerDetails
   */
  public sendMany(messages: Message[], customerDetails: UserDetail[]) {
    this._emailService.sendMany(messages, customerDetails);
  }

  /**
   * reminds the customer of the due date of his items
   * @param {UserDetail} the customer to send reminder to
   * @param {CustomerItem[]} the customerItems to remind of
   */
  public remind(
    message: Message,
    customerDetail: UserDetail,
    customerItems: CustomerItem[],
  ) {
    this._emailService.remind(message, customerDetail, customerItems);
  }

  /**
   * sends out reminders to more than one customer
   * @param {CustomerDetailWithCustomerItem[]} customerDetails with customerItems to remind about
   */
  public remindMany(
    customerDetailsWithCustomerItems: CustomerDetailWithCustomerItem[],
  ) {
    this._emailService.remindMany(customerDetailsWithCustomerItems);
  }

  /**
   * sends out notifications to the customer when order is placed
   * @param {UserDetail} customerDetail
   * @param {Order} order
   */
  public orderPlaced(customerDetail: UserDetail, order: Order) {
    this._emailService.orderPlaced(customerDetail, order);
  }

  /**
   * returns a pdf of the receipt of the provided order
   * @param {UserDetail} customerDetail
   * @param {Order} order
   */
  public getOrderReceiptPdf(customerDetail: UserDetail, order: Order) {
    return this._pdfService.getOrderReceiptPdf(customerDetail, order);
  }

  /**
   * returns a pdf of the agreement of the provided order
   * @param {UserDetail} customerDetail
   * @param {Order} order
   */
  public getOrderAgreementPdf(customerDetail: UserDetail, order: Order) {
    return this._pdfService.getOrderAgreementPdf(customerDetail, order);
  }

  public sendDeliveryInformation(customerDetail: UserDetail, order: Order) {
    const deliveryId = typeof order.delivery === "string" ? order.delivery : "";
    this._deliveryStorage
      .get(deliveryId)
      .then((delivery: Delivery) => {
        this._emailService.deliveryInformation(customerDetail, order, delivery);
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }

  /**
   * sends out message to customer with a link to confirm email
   * @param {UserDetail} customerDetail
   * @param {string} confirmationCode
   */
  public emailConfirmation(
    customerDetail: UserDetail,
    confirmationCode: string,
  ) {
    this._emailService.emailConfirmation(customerDetail, confirmationCode);
  }

  /**
   * sends out message to customer with a link to reset password
   * @param {string} userId the ID of the user in the Users collection
   * @param {string} userEmail the email (username) of the user in the Users collection
   * @param pendingPasswordResetId the ID of the PendingPasswordReset for the request
   * @param resetToken the token required to confirm the PendingPasswordReset
   */
  public async passwordReset(
    userId: string,
    userEmail: string,
    pendingPasswordResetId: string,
    resetToken: string,
  ): Promise<void> {
    await this._emailService.passwordReset(
      userId,
      userEmail,
      pendingPasswordResetId,
      resetToken,
    );
  }
}
