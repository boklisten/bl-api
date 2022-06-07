import { BlCollection, BlEndpoint } from "../bl-collection";
import { matchSchema } from "./match.schema";
import { MatchPostHook } from "./hooks/match.post.hook";

export class MatchCollection implements BlCollection {
  public collectionName = "matches";
  public mongooseSchema = matchSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      restriction: {
        permissions: ["customer", "employee", "admin", "super"],
      },
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
