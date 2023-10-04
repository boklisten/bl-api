import {
  BlCollection,
  BlCollectionName,
  BlDocumentPermission,
  BlEndpoint,
} from "../bl-collection";
import { uniqueItemSchema } from "./unique-item.schema";
import { UniqueItemActiveOperation } from "./operations/unique-item-active.operation";
import { GenerateUniqueIdsOperation } from "./operations/generate-unique-ids-operation";

export class UniqueItemCollection implements BlCollection {
  public collectionName = BlCollectionName.UniqueItems;
  public mongooseSchema = uniqueItemSchema;
  documentPermission: BlDocumentPermission = {
    viewableForPermission: "employee",
  };

  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      restriction: {
        permissions: ["employee", "manager", "admin", "super"],
      },
      operations: [
        {
          name: "generate",
          operation: new GenerateUniqueIdsOperation(),
          restriction: { permissions: ["admin", "super"] },
        },
      ],
    },
    {
      method: "getId",
      restriction: {
        permissions: ["employee", "manager", "admin", "super"],
      },
      operations: [
        {
          name: "active",
          operation: new UniqueItemActiveOperation(),
          /*
          restriction: {
            permissions: [""employee", "manager", "admin", "super"]
          }
          */
        },
      ],
    },
    {
      method: "getAll",
      restriction: {
        permissions: ["employee", "manager", "admin", "super"],
      },
      validQueryParams: [
        { fieldName: "blid", type: "string" },
        { fieldName: "item", type: "object-id" },
      ],
    },
  ];
}
