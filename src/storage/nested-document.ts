import { BlCollectionName } from "../collections/bl-collection";

export type NestedDocument = {
  field: string;
  collection: BlCollectionName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mongooseSchema: any;
};
