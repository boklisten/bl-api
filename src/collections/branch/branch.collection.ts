import { BlCollection, BlEndpoint } from "../bl-collection";
import { branchSchema } from "./branch.schema";
import { Schema } from "mongoose";
import { BranchPostHook } from "./hook/branch-post.hook";
import { BranchGetHook } from "./hook/branch-get.hook";

export class BranchCollection implements BlCollection {
  collectionName = "branches";
  mongooseSchema = branchSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getAll",
      hook: new BranchGetHook()
    },
    {
      method: "getId",
      hook: new BranchGetHook()
    },
    {
      method: "post",
      hook: new BranchPostHook(),
      restriction: {
        permissions: ["admin", "super"]
      }
    },
    {
      method: "patch",
      restriction: {
        permissions: ["admin", "super"]
      }
    }
  ];
}
