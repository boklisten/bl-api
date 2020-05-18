import { Hook } from "../../../hook/hook";
import {
  AccessToken,
  Booking,
  BlError,
  UserDetail
} from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { bookingSchema } from "../booking.schema";
import { PermissionService } from "../../../auth/permission/permission.service";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { DateService } from "../../../blc/date.service";
import { isNullOrUndefined } from "util";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { EmailService } from "../../../messenger/email/email-service";
import { BookingEmailService } from "../../../messenger/email/booking-email-service";

export class BookingPatchHook extends Hook {
  private bookingStorage: BlDocumentStorage<Booking>;
  private permissionService: PermissionService;
  private dbQueryBuilder: SEDbQueryBuilder;
  private dateService: DateService;
  private bookingEmailService: BookingEmailService;

  constructor(
    bookingStorage?: BlDocumentStorage<Booking>,
    bookingEmailService?: BookingEmailService
  ) {
    super();
    this.bookingStorage = bookingStorage
      ? bookingStorage
      : new BlDocumentStorage<Booking>("bookings", bookingSchema);
    this.permissionService = new PermissionService();
    this.dbQueryBuilder = new SEDbQueryBuilder();
    this.dateService = new DateService();
    this.bookingEmailService = bookingEmailService
      ? bookingEmailService
      : new BookingEmailService();
  }

  public async before(
    body: any,
    accessToken: AccessToken,
    id: string
  ): Promise<boolean> {
    if (!id) {
      throw new BlError("id is not provided");
    }

    if (!body) {
      throw new BlError("body is not provided");
    }

    let booking: Booking;

    try {
      booking = await this.bookingStorage.get(id);
    } catch (e) {
      throw new BlError("not found").code(702);
    }

    if (booking.customer && body.customer) {
      throw new BlError("customer is already attached to booking");
    }

    if (
      !this.permissionService.isPermissionEqualOrOver(
        accessToken.permission,
        "admin"
      )
    ) {
      for (let key of Object.keys(body)) {
        if (key !== "customer" && key !== "booked") {
          throw new BlError("can only update 'customer' and 'booked' fields");
        }
      }

      if (body.customer && accessToken.details !== body.customer) {
        throw new BlError("can only update booking with customers own id");
      }
    }

    let activeBookings;

    if (body.customer) {
      try {
        let query = this.dbQueryBuilder.getDbQuery(
          {
            customer: body.customer,
            from:
              ">" +
              this.dateService.format(new Date(), "Europe/Oslo", "DDMMYYYYHHMM")
          },
          [
            { fieldName: "from", type: "date" },
            { fieldName: "customer", type: "object-id" }
          ]
        );

        activeBookings = await this.bookingStorage.getByQuery(query);
      } catch (e) {
        if (e instanceof BlError) {
          if (e.getCode() === 702) {
            return true;
          }
        }
        throw e;
      }

      if (activeBookings && activeBookings.length > 0) {
        throw new BlError("customer already has an active booking");
      }
    } else {
      if (!this.permissionService.isAdmin(accessToken.permission)) {
        let booking;
        try {
          booking = await this.bookingStorage.get(id);
        } catch (e) {
          throw e;
        }
        if (
          booking &&
          booking.customer.toString() !== accessToken.details.toString()
        ) {
          throw new BlError(
            `user "${
              accessToken.details
            }" has no permission to cancel booking "${id}"`
          );
        }
      }
      return true;
    }

    return false;
  }

  public async after(
    bookings: Booking[],
    accessToken: AccessToken
  ): Promise<Booking[]> {
    for (let booking of bookings) {
      if (!booking.booked && booking.customer) {
        throw new BlError("booking.customer is set but booked is false");
      }

      if (booking.booked && isNullOrUndefined(booking.customer)) {
        throw new BlError(
          "booking.booked is set but customer is null or undefined"
        );
      }

      if (
        !this.permissionService.isPermissionEqualOrOver(
          accessToken.permission,
          "admin"
        )
      ) {
        let subtype = null;

        if (booking.booked && booking.customer) {
          subtype = "confirmed";
        } else if (!booking.booked && isNullOrUndefined(booking.customer)) {
          subtype = "canceled";
        }

        if (subtype) {
          console.log("should send mail", subtype);
          try {
            const result = await this.bookingEmailService.sendBookingEmail(
              accessToken.details,
              booking,
              subtype,
              { id: accessToken.details, permission: accessToken.permission }
            );
            console.log("result", result);
          } catch (e) {
            console.log("error mail", e);
          }
        }
      }
    }

    return bookings;
  }
}
