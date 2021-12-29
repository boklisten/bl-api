export type NestedDocument = {
  field: string;
  collection: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mongooseSchema: any;
};
