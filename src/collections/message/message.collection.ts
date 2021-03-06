import { BlCollection, BlEndpoint } from "../bl-collection";
import { MessagePostHook } from "./hooks/message-post.hook";
import { messageSchema } from "./message.schema";
import { Schema } from "mongoose";
import { SendgridEventOperation } from "./operations/sendgrid-event.operation";
import { TwilioSmsEventOperation } from "./operations/twillio-sms-event.operation";

export class MessageCollection implements BlCollection {
  public collectionName = "messages";
  public mongooseSchema = messageSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      hook: new MessagePostHook(),
      restriction: {
        permissions: ["admin", "super"],
      },
      operations: [
        {
          name: "sendgrid-events",
          operation: new SendgridEventOperation(),
        },
        {
          name: "twilio-sms-events",
          operation: new TwilioSmsEventOperation(),
        },
      ],
    },
    {
      method: "getAll",
      validQueryParams: [
        {
          fieldName: "customerId",
          type: "string",
        },
      ],
      restriction: {
        permissions: ["admin", "super"],
      },
    },
    {
      method: "getId",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
    {
      method: "delete",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
  ];
}
