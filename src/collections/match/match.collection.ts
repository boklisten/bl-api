import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";
import { matchSchema } from "./match.schema";
import { MatchPostHook } from "./hooks/match.post.hook";

export class MatchCollection implements BlCollection {
  public collectionName = BlCollectionName.Matches;
  public mongooseSchema = matchSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      hook: new MatchPostHook(),
    },
    {
      method: "patch",
    },
    {
      method: "getAll",
      restriction: {
        permissions: ["customer", "employee", "admin", "super"],
      },
      validQueryParams: [{ fieldName: "sender.customerId", type: "object-id" }],
    },
    {
      method: "getId",
    },
  ];
}
