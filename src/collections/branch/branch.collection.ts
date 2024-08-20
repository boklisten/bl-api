import { branchSchema } from "./branch.schema";
import { BranchGetHook } from "./hook/branch-get.hook";
import { BranchPostHook } from "./hook/branch-post.hook";
import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";

export class BranchCollection implements BlCollection {
  collectionName = BlCollectionName.Branches;
  mongooseSchema = branchSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getAll",
      hook: new BranchGetHook(),
      validQueryParams: [
        {
          fieldName: "id",
          type: "string",
        },
        {
          fieldName: "name",
          type: "string",
        },
        {
          fieldName: "location.region",
          type: "string",
        },
        {
          fieldName: "location.bookable",
          type: "boolean",
        },
        {
          fieldName: "active",
          type: "boolean",
        },
        {
          fieldName: "location.address",
          type: "string",
        },
        {
          fieldName: "openingHours",
          type: "expand",
        },
      ],
    },
    {
      method: "post",
      hook: new BranchPostHook(),
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
  ];
}
