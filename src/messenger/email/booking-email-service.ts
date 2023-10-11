import { UserDetail, Message, Booking, Branch } from "@boklisten/bl-model";
import { EmailService } from "./email-service";
import { messageSchema } from "../../collections/message/message.schema";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { branchSchema } from "../../collections/branch/branch.schema";
import { DateService } from "../../blc/date.service";
import { userDetailSchema } from "../../collections/user-detail/user-detail.schema";
import { BlCollectionName } from "../../collections/bl-collection";

export class BookingEmailService {
  private emailService: EmailService;
  private messageStorage: BlDocumentStorage<Message>;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private branchStorage: BlDocumentStorage<Branch>;
  private dateService: DateService;

  constructor() {
    this.emailService = new EmailService();
    this.messageStorage = new BlDocumentStorage(
      BlCollectionName.Messages,
      messageSchema,
    );
    this.userDetailStorage = new BlDocumentStorage(
      BlCollectionName.UserDetails,
      userDetailSchema,
    );
    this.branchStorage = new BlDocumentStorage(
      BlCollectionName.Branches,
      branchSchema,
    );
    this.dateService = new DateService();
  }

  public async sendBookingEmail(
    userId: string,
    booking: Booking,
    subtype: "confirmed" | "canceled",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any,
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
      // eslint-disable-next-line no-empty
    } catch (e) {}

    const userDetail = await this.userDetailStorage.get(userId);

    const branch = await this.branchStorage.get(booking.branch);
    let address = "";
    if (branch.location) {
      address = branch.location.address ? branch.location.address : "";
    }

    const bookingDetails = {
      date: this.dateService.toPrintFormat(booking.from, "Europe/Oslo"),
      hour:
        "kl. " + this.dateService.format(booking.from, "Europe/Oslo", "HH:mm"),
      branch: branch.name,
      address: address,
    };

    return this.emailService.sendBookingEmail(
      message,
      userDetail,
      bookingDetails,
    );
  }
}
