import { BlDocument, BlError, UserPermission } from "@boklisten/bl-model";
import { Model, Schema, Types } from "mongoose";

import { MongooseModelCreator } from "./mongoose-schema-creator";
import { PermissionService } from "../../auth/permission/permission.service";
import { BlCollectionName } from "../../collections/bl-collection";
import { logger } from "../../logger/logger";
import { ExpandFilter } from "../../query/expand-filter/db-query-expand-filter";
import { SEDbQuery } from "../../query/se.db-query";
import { BlStorageHandler } from "../blStorageHandler";
import { NestedDocument } from "../nested-document";

export class MongoDbBlStorageHandler<T extends BlDocument>
  implements BlStorageHandler<T>
{
  private mongooseModel: Model<T>;
  private permissionService: PermissionService;

  constructor(collectionName: BlCollectionName, schema: Schema<T>) {
    const mongooseModelCreator = new MongooseModelCreator(
      collectionName,
      schema,
    );
    this.mongooseModel = mongooseModelCreator.create();
    this.permissionService = new PermissionService();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async get(id: string, userPermission?: UserPermission): Promise<T> {
    try {
      const doc = await this.mongooseModel.findById(id).exec();
      if (!doc) {
        throw new BlError(`object "${id}" not found`).code(702);
      }
      return doc;
    } catch (error) {
      throw this.handleError(
        new BlError(`error when trying to find document with id "${id}"`),
        error,
      );
    }
  }
  public async getByQuery(
    dbQuery: SEDbQuery,
    allowedNestedDocuments?: NestedDocument[],
  ): Promise<T[]> {
    logger.silly(
      `mongoose.find(${JSON.stringify(dbQuery.getFilter())}, ${JSON.stringify(
        dbQuery.getOgFilter(),
      )}).limit(${dbQuery.getLimitFilter()}).skip(${dbQuery.getSkipFilter()}).sort(${JSON.stringify(
        dbQuery.getSortFilter(),
      )})`,
    );
    try {
      const docs = await this.mongooseModel
        .find(dbQuery.getFilter(), dbQuery.getOgFilter())
        .limit(dbQuery.getLimitFilter())
        .skip(dbQuery.getSkipFilter())
        .sort(dbQuery.getSortFilter())
        .exec();

      if (docs.length <= 0) {
        throw new BlError("not found").code(702);
      }

      const expandFilters = dbQuery.getExpandFilter();
      if (allowedNestedDocuments && allowedNestedDocuments.length > 0) {
        return this.retrieveNestedDocuments(
          docs,
          allowedNestedDocuments,
          expandFilters,
        );
      } else {
        return docs;
      }
    } catch (error) {
      throw this.handleError(
        new BlError(`could not find document by the provided query`),
        error,
      );
    }
  }

  public async getMany(
    ids: string[],
    userPermission?: UserPermission,
  ): Promise<T[]> {
    try {
      const idArr = ids.map((id) => new Types.ObjectId(id));
      // if user have admin privileges, he can also get documents that are inactive
      const filter =
        userPermission && this.permissionService.isAdmin(userPermission)
          ? { _id: { $in: idArr } }
          : { _id: { $in: idArr }, active: true };

      return await this.mongooseModel.find(filter).exec();
    } catch (error) {
      throw this.handleError(
        new BlError("error when trying to find documents"),
        error,
      );
    }
  }

  public async aggregate(aggregation: unknown[]): Promise<T[]> {
    try {
      return await this.mongooseModel.aggregate(aggregation).exec();
    } catch (error) {
      throw this.handleError(
        new BlError("failed to aggregate documents"),
        error,
      );
    }
  }
  public async getAll(userPermission?: UserPermission): Promise<T[]> {
    try {
      const filter =
        userPermission && this.permissionService.isAdmin(userPermission)
          ? {}
          : { active: true };
      return await this.mongooseModel.find(filter).exec();
    } catch (error) {
      throw this.handleError(new BlError("failed to get all documents"), error);
    }
  }

  public async add(
    doc: T,
    user?: { id: string; permission: UserPermission },
  ): Promise<T> {
    try {
      doc.creationTime = new Date();
      doc.lastUpdated = new Date();

      if (user) {
        doc.user = user;
      }

      const newDocument = new this.mongooseModel(doc);
      return (await newDocument.save()) as unknown as T;
    } catch (error) {
      throw this.handleError(
        new BlError("error when trying to add document").data(doc),
        error,
      );
    }
  }

  public addMany(docs: T[]): Promise<T[]> {
    return this.mongooseModel.insertMany(docs);
  }
  public async update(
    id: string,
    data: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user: { id: string; permission: UserPermission },
  ): Promise<T> {
    try {
      if (data["user"]) {
        throw new BlError(
          "can not change user restrictions after creation",
        ).code(701);
      }

      const document = await this.mongooseModel.findById(id).exec();
      if (!document) {
        throw new BlError(`could not find document with id "${id}"`).code(702);
      }

      document.set(data);
      document.set({ lastUpdated: new Date() });

      return (await document.save()) as unknown as T;
    } catch (error) {
      logger.error(`failed to save document: ${error}`);
      throw this.handleError(
        new BlError(`failed to update document with id ${id}`).store(
          "data",
          data,
        ),
        error,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public updateMany(docs: { id: string; data: unknown }[]): Promise<T[]> {
    throw new BlError("not implemented");
  }

  public async remove(
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user: { id: string; permission: UserPermission },
  ): Promise<T> {
    try {
      const doc = await this.mongooseModel.findByIdAndRemove(id).exec();
      if (!doc) {
        throw new BlError(`could not remove document with id "${id}"`).code(
          702,
        );
      }
      return doc;
    } catch (error) {
      throw this.handleError(
        new BlError(`could not remove document with id "${id}"`),
        error,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeMany(ids: string[]): Promise<T[]> {
    throw new BlError("not implemented");
  }

  public async exists(id: string): Promise<boolean> {
    try {
      await this.get(id);
      return true;
    } catch (error) {
      throw new BlError(`document with id ${id} does not exist`).code(702);
    }
  }

  /**
   * Tries to fetch all nested values on the specified documents.
   * @param {BlDocument[]} docs the documents to search through
   * @param allowedNestedDocuments
   * @param {ExpandFilter} expandFilters the nested documents to fetch
   * @param {UserPermission} userPermission
   */

  private async retrieveNestedDocuments(
    docs: T[],
    allowedNestedDocuments: NestedDocument[],
    expandFilters: ExpandFilter[],
    userPermission?: UserPermission,
  ): Promise<T[]> {
    if (!expandFilters || expandFilters.length <= 0) {
      return docs;
    }
    const expandedNestedDocuments = allowedNestedDocuments.filter(
      (nestedDocument) =>
        expandFilters.some(
          (expandFilter) => expandFilter.fieldName === nestedDocument.field,
        ),
    );

    try {
      return await Promise.all(
        docs.map((doc) =>
          this.getNestedDocuments(doc, expandedNestedDocuments, userPermission),
        ),
      );
    } catch (error) {
      throw new BlError("could not retrieve nested documents")
        .code(702)
        .add(error);
    }
  }

  private async getNestedDocuments<T extends BlDocument>(
    doc: T,
    nestedDocuments: NestedDocument[],
    userPermission?: UserPermission,
  ): Promise<T> {
    const nestedDocumentsPromArray = nestedDocuments.flatMap(
      (nestedDocument) =>
        doc && doc[nestedDocument.field]
          ? [
              this.getNestedDocument(
                doc[nestedDocument.field],
                nestedDocument,
                userPermission,
              ),
            ]
          : [],
    );

    try {
      const nestedDocs = await Promise.all(nestedDocumentsPromArray);

      for (let i = 0; i < nestedDocuments.length; i++) {
        doc[nestedDocuments[i].field] = nestedDocs[i];
      }

      return doc;
    } catch (nestedDocumentError) {
      return doc;
    }
  }

  private getNestedDocument(
    id: string,
    nestedDocument: NestedDocument,
    userPermission?: UserPermission,
  ): Promise<BlDocument> {
    const documentStorage = new MongoDbBlStorageHandler(
      nestedDocument.collection,
      nestedDocument.mongooseSchema,
    );
    return documentStorage.get(id, userPermission);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private handleError(blError: BlError, error: any): BlError {
    if (error) {
      if (error.name === "CastError") {
        return blError.code(702).store("castError", error);
      } else if (error.name === "ValidationError") {
        return blError.code(701).store("validationError", error);
      } else {
        return blError.code(200);
      }
    } else {
      return new BlError("EndpointMongoDb: unknown error")
        .add(blError)
        .code(200);
    }
  }
}
