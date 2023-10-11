import { branchItemSchema } from "./branch-item.schema";
import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";

export class BranchItemCollection implements BlCollection {
  collectionName = BlCollectionName.BranchItems;
  mongooseSchema = branchItemSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getId",
    },
    {
      method: "post",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
    {
      method: "patch",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
    {
      method: "getAll",
      validQueryParams: [{ fieldName: "branch", type: "object-id" }],
    },
    {
      method: "delete",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
  ];
}
