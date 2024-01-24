import { Schema } from "mongoose";

import { BlCollectionName } from "../collections/bl-collection";

export type NestedDocument = {
  field: string;
  collection: BlCollectionName;
  mongooseSchema: Schema;
};
