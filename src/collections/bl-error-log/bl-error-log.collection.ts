import { BlCollection, BlEndpoint } from "../bl-collection";
import { blErrorLogSchema } from "./bl-error-log.schema";

export class BlErrorLogCollection implements BlCollection {
  collectionName = "blerrorlogs";
  mongooseSchema = blErrorLogSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getAll",
      restriction: {
        permissions: ["super"],
      },
      validQueryParams: [
        {
          fieldName: "msg",
          type: "string",
        },
        {
          fieldName: "code",
          type: "number",
        },
      ],
    },
  ];
}
