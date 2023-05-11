import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";
import { invoiceSchema } from "./invoice.schema";

export class InvoiceCollection implements BlCollection {
  collectionName = BlCollectionName.Invoices;
  mongooseSchema = invoiceSchema;
  endpoints: BlEndpoint[] = [
    {
      method: "getId",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
    {
      method: "getAll",
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
  ];
}
