import { Hook } from "../hook/hook";
import { UserPermission } from "@boklisten/bl-model";
import { ValidParam } from "../query/valid-param/db-query-valid-params";
import { Operation } from "../operation/operation";
import { NestedDocument } from "../storage/nested-document";

export interface BlCollection {
  collectionName: string; //the name determines the path to the collection like /api/vi/collectionName
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mongooseSchema: any; //the mongooseSchema for this collection
  documentPermission?: BlDocumentPermission;
  endpoints: BlEndpoint[]; //a list of the valid endpoints for this collection;
}

export interface BlEndpointRestriction {
  permissions: UserPermission[]; //a list of the permission the user needs
  restricted?: boolean; //if set this endpoint is restricted to the user or for a user with higher permission
  secured?: boolean; //this endpoint is only accessible to the user that created it
}

export interface BlEndpointOperation {
  name: string;
  operation: Operation;
  restriction?: BlEndpointRestriction;
}

export type BlEndpointMethod =
  | "getAll"
  | "getId"
  | "getQuery"
  | "post"
  | "put"
  | "patch"
  | "delete";

export interface BlEndpoint {
  method: BlEndpointMethod;
  hook?: Hook; //an optional hook for this endpoint
  validQueryParams?: ValidParam[];
  nestedDocuments?: NestedDocument[]; // what nested documents should be retrieved at request
  restriction?: BlEndpointRestriction; //this endpoint is only accessible to the user that created it
  operations?: BlEndpointOperation[];
}

export interface BlDocumentPermission {
  viewableForPermission: UserPermission; // the lowest permission you need to have to view documents not your own
}
