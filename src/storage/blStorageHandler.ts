/* eslint-disable @typescript-eslint/no-explicit-any */
import { BlDocument, UserPermission } from "@boklisten/bl-model";
import { SEDbQuery } from "../query/se.db-query";
import { NestedDocument } from "./nested-document";

export interface BlStorageHandler<T extends BlDocument> {
  get(
    id: string,
    userPermission?: UserPermission,
    nestedDocuments?: NestedDocument[],
  ): Promise<T>;

  getMany(
    ids: string[],
    userPermission?: UserPermission,
    nestedDocuments?: NestedDocument[],
  ): Promise<T[]>;

  getByQuery(
    dbQuery: SEDbQuery,
    nestedDocuments?: NestedDocument[],
  ): Promise<T[]>;

  getAll(
    userPermission?: UserPermission,
    nestedDocuments?: NestedDocument[],
  ): Promise<T[]>;

  add(doc: T, user: { id: string; permission: UserPermission }): Promise<T>;

  addMany(docs: T[]): Promise<T[]>;

  update(
    id: string,
    data: any,
    user: { id: string; permission: UserPermission },
  ): Promise<T>;

  updateMany(docs: { id: string; data: any }[]): Promise<T[]>;

  remove(
    id: string,
    user: { id: string; permission: UserPermission },
  ): Promise<T>;

  removeMany(ids: string[]): Promise<T[]>;

  aggregate(aggregation: any[]): Promise<T[]>;

  exists(id: string): Promise<boolean>;
}
