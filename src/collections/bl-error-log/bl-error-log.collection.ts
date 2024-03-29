import { blErrorLogSchema } from "./bl-error-log.schema";
import { BlCollection, BlEndpoint, BlCollectionName } from "../bl-collection";

export class BlErrorLogCollection implements BlCollection {
  collectionName = BlCollectionName.BlErrorLogs;
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
