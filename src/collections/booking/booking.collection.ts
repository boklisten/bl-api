import { BlCollection, BlEndpoint } from "../bl-collection";
import { Schema } from "mongoose";
import { bookingSchema } from "./booking.schema";

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
          fieldName: "branch",
          type: "object-id"
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
      restriction: {
        permissions: ["customer", "employee", "manager", "admin", "super"]
      }
    }
  ];
}
