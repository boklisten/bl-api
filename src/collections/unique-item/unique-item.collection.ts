import { Schema } from "mongoose";
import {
  BlCollection,
  BlDocumentPermission,
  BlEndpoint
} from "../bl-collection";
import { uniqueItemSchema } from "./unique-item.schema";

export class UniqueItemCollection implements BlCollection {
  public collectionName = "uniqueitems";
  public mongooseSchema = uniqueItemSchema;
  documentPermission: BlDocumentPermission = {
    viewableForPermission: "employee"
  };

  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      restriction: {
        permissions: ["employee", "manager", "admin", "super"]
      }
    },
    {
      method: "getAll",
      restriction: {
        permissions: ["employee", "manager", "admin", "super"]
      },
      validQueryParams: [
        { fieldName: "blid", type: "string" },
        { fieldName: "item", type: "object-id" }
      ]
    }
  ];
}
