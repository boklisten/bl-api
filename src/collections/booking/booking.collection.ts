import { BlCollection, BlEndpoint } from "../bl-collection";
import { Schema } from "mongoose";
import { bookingSchema } from "./booking.schema";
import { BookingPatchHook } from "./hook/booking-patch.hook";

export class BookingCollection implements BlCollection {
  collectionName = "bookings";
  mongooseSchema = bookingSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getAll",
      validQueryParams: [
        {
          fieldName: "from",
          type: "date"
        },
        {
          fieldName: "to",
          type: "date"
        },
        {
          fieldName: "branch",
          type: "object-id"
        },
        {
          fieldName: "customer",
          type: "string"
        },
        {
          fieldName: "booked",
          type: "boolean"
        }
      ]
    },
    {
      method: "getId"
    },
    {
      method: "post",
      restriction: {
        permissions: ["admin", "super"]
      }
    },
    {
      method: "patch",
      hook: new BookingPatchHook(),
      restriction: {
        permissions: ["customer", "employee", "manager", "admin", "super"]
      }
    }
  ];
}
