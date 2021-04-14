import { BlCollection, BlEndpoint } from "../bl-collection";

import { companySchema } from "./company.schema";

export class CompanyCollection implements BlCollection {
  collectionName = "companies";
  mongooseSchema = companySchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getAll",
      restriction: {
        permissions: ["admin", "super"],
      },
      validQueryParams: [
        {
          fieldName: "name",
          type: "string",
        },
      ],
    },
    {
      method: "getId",
      restriction: {
        permissions: ["admin", "super"],
      },
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
      method: "delete",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
  ];
}
