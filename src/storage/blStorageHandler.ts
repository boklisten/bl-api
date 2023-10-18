import { BlDocument, UserPermission } from "@boklisten/bl-model";

import { NestedDocument } from "./nested-document";
import { SEDbQuery } from "../query/se.db-query";

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
    data: unknown,
    user: { id: string; permission: UserPermission },
  ): Promise<T>;

  updateMany(docs: { id: string; data: unknown }[]): Promise<T[]>;

  remove(
    id: string,
    user: { id: string; permission: UserPermission },
  ): Promise<T>;

  removeMany(ids: string[]): Promise<T[]>;

  aggregate(aggregation: unknown[]): Promise<T[]>;

  exists(id: string): Promise<boolean>;
}
