import { UserDetail, Message, Booking, Branch } from "@boklisten/bl-model";
import { EmailService } from "./email-service";
import { messageSchema } from "../../collections/message/message.schema";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { branchSchema } from "../../collections/branch/branch.schema";
import { DateService } from "../../blc/date.service";
import {
  Recipient,
  MessageOptions,
  PostOffice,
  postOffice,
} from "@boklisten/bl-post-office";
import { userDetailSchema } from "../../collections/user-detail/user-detail.schema";

export class BookingEmailService {
  private emailService: EmailService;
  private messageStorage: BlDocumentStorage<Message>;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private branchStorage: BlDocumentStorage<Branch>;
  private dateService: DateService;

  constructor() {
    this.emailService = new EmailService();
    this.messageStorage = new BlDocumentStorage("messages", messageSchema);
    this.userDetailStorage = new BlDocumentStorage(
      "userDetails",
      userDetailSchema
    );
    this.branchStorage = new BlDocumentStorage("branches", branchSchema);
    this.dateService = new DateService();
  }

  public async sendBookingEmail(
    userId: string,
    booking: Booking,
    subtype: "confirmed" | "canceled",
    user: any
  ): Promise<boolean> {
    let message: Message = {
      messageType: "booking",
      messageSubtype: subtype,
      messageMethod: "email",
      sequenceNumber: 0,
      customerId: booking.customer,
    } as Message;

    try {
      message = await this.messageStorage.add(message, user);
    } catch (e) {}

    let userDetail = await this.userDetailStorage.get(userId);

    let branch = await this.branchStorage.get(booking.branch);
    let address = "";
    if (branch.location) {
      address = branch.location.address ? branch.location.address : "";
    }

    let bookingDetails = {
      date: this.dateService.toPrintFormat(booking.from, "Europe/Oslo"),
      hour:
        "kl. " + this.dateService.format(booking.from, "Europe/Oslo", "HH:mm"),
      branch: branch.name,
      address: address,
    };

    return this.emailService.sendBookingEmail(
      message,
      userDetail,
      bookingDetails
    );
  }
}
