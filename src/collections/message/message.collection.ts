import { BlCollection } from "../bl-collection";
import { BlEndpoint } from "../../endpoint/bl-endpoint";
import { MessagePostHook } from "./hooks/message-post.hook";
import { messageSchema } from "./message.schema";
import {Schema} from 'mongoose';

export class MessageCollection implements BlCollection {
  public collectionName = 'messages';
  public mongooseSchema = messageSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: 'post',
      hook: new MessagePostHook(),
      restriction: {
        permissions: ["customer", "employee", "manager", "admin", "super"],
        restricted: true
      }
    }
  ];
}
