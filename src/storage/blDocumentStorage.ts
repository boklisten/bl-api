/* eslint-disable @typescript-eslint/no-unused-vars */
import { BlDocument, BlError, UserPermission } from "@boklisten/bl-model";
import { Schema } from "mongoose";

import { BlStorageHandler } from "./blStorageHandler";
import { MongoDbBlStorageHandler } from "./mongoDb/mongoDb.blStorageHandler";
import { NestedDocument } from "./nested-document";
import { BlCollectionName } from "../collections/bl-collection";
import { SEDbQuery } from "../query/se.db-query";

export class BlDocumentStorage<T extends BlDocument>
  implements BlStorageHandler<T>
{
  private mongoDbHandler: MongoDbBlStorageHandler<T>;

  constructor(
    private collectionName: BlCollectionName,
    private mongooseSchema?: Schema,
  ) {
    if (mongooseSchema) {
      this.mongoDbHandler = new MongoDbBlStorageHandler(
        collectionName,
        mongooseSchema,
      );
    }
  }

  get(id: string, userPermission?: UserPermission): Promise<T> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .get(id, userPermission)
        .then((doc: T) => {
          resolve(doc);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  getByQuery(
    dbQuery: SEDbQuery,
    nestedDocuments?: NestedDocument[],
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .getByQuery(dbQuery, nestedDocuments)
        .then((docs: T[]) => {
          resolve(docs);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  getMany(
    ids: string[],
    userPermission?: UserPermission,
    nestedDocuments?: NestedDocument[],
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .getMany(ids, userPermission)
        .then((docs: T[]) => {
          resolve(docs);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  getAll(
    userPermission?: UserPermission,
    nestedDocuments?: NestedDocument[],
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .getAll(userPermission)
        .then((docs: T[]) => {
          resolve(docs);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  add(doc: T, user: { id: string; permission: UserPermission }): Promise<T> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .add(doc, user)
        .then((addedDoc: T) => {
          resolve(addedDoc);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  addMany(docs: T[]): Promise<T[]> {
    return this.mongoDbHandler.addMany(docs);
  }

  update(
    id: string,
    data: unknown,
    user: { id: string; permission: UserPermission },
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .update(id, data, user)
        .then((updatedDoc: T) => {
          resolve(updatedDoc);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  updateMany(docs: { id: string; data: unknown }[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      reject(new BlError("not implemented"));
    });
  }

  remove(
    id: string,
    user: { id: string; permission: UserPermission },
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .remove(id, user)
        .then((deletedDoc: T) => {
          resolve(deletedDoc);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  aggregate(aggregation: unknown[]): Promise<T[]> {
    return this.mongoDbHandler.aggregate(aggregation);
  }

  removeMany(ids: string[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      reject(new BlError("not implemented"));
    });
  }

  exists(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mongoDbHandler
        .exists(id)
        .then(() => {
          resolve(true);
        })
        .catch((existsError: BlError) => {
          reject(existsError);
        });
    });
  }
}
