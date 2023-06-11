import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";
import { itemSchema } from "./item.schema";
import { ItemPostHook } from "./hook/item-post.hook";
import { ItemPatchHook } from "./hook/item-patch.hook";

export class ItemCollection implements BlCollection {
  collectionName = BlCollectionName.Items;
  mongooseSchema = itemSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getId",
    },
    {
      method: "getAll",
      validQueryParams: [
        {
          fieldName: "title",
          type: "string",
        },
        {
          fieldName: "type",
          type: "string",
        },
        {
          fieldName: "info.isbn",
          type: "number",
        },
        {
          fieldName: "buyback",
          type: "boolean",
        },
        {
          fieldName: "creationTime",
          type: "date",
        },
        {
          fieldName: "price",
          type: "number",
        },
        {
          fieldName: "active",
          type: "boolean",
        },
      ],
    },
    {
      method: "post",
      hook: new ItemPostHook(),
      restriction: {
        permissions: ["admin", "super"],
      },
    },
    {
      method: "patch",
      hook: new ItemPatchHook(),
      restriction: {
        permissions: ["admin", "super"],
      },
    },
  ];
}
