import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";
import { matchSchema } from "./match.schema";
import { MatchGenerateOperation } from "./operations/match-generate.operation";
import { MatchNotifyOperation } from "./operations/match-notify.operation";

export class MatchCollection implements BlCollection {
  public collectionName = BlCollectionName.Matches;
  public mongooseSchema = matchSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      operations: [
        {
          name: "generate",
          operation: new MatchGenerateOperation(),
          restriction: { permissions: ["admin", "super"] },
        },
        {
          name: "notify",
          operation: new MatchNotifyOperation(),
          restriction: { permissions: ["admin", "super"] },
        },
      ],
      restriction: {
        permissions: ["super"],
      },
    },
    {
      method: "patch",
    },
    {
      method: "getAll",
      restriction: {
        permissions: ["customer", "employee", "admin", "super"],
      },
      validQueryParams: [
        { fieldName: "_variant", type: "string" },
        { fieldName: "sender", type: "object-id" },
        { fieldName: "receiver", type: "object-id" },
        { fieldName: "customer", type: "object-id" },
      ],
    },
    {
      method: "getId",
    },
  ];
}
