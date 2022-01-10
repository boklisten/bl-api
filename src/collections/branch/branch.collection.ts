import { BlCollection, BlEndpoint } from "../bl-collection";
import { branchSchema } from "./branch.schema";
import { BranchPostHook } from "./hook/branch-post.hook";
import { BranchGetHook } from "./hook/branch-get.hook";
import { BranchBookingTimesOperation } from "./operations/branch-booking-times.operation";

export class BranchCollection implements BlCollection {
  collectionName = "branches";
  mongooseSchema = branchSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getAll",
      hook: new BranchGetHook(),
      validQueryParams: [
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
      method: "getId",
      hook: new BranchGetHook(),
      operations: [
        {
          name: "booking-dates",
          operation: new BranchBookingTimesOperation(),
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
