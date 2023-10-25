import mongoose, { Schema } from "mongoose";

import { BlCollectionName } from "../../collections/bl-collection";

export class MongooseModelCreator {
  constructor(
    private collectionName: BlCollectionName,
    private schema: unknown,
  ) {}

  create() {
    const mongooseSchema = this.createMongooseSchema(this.schema);
    if (this.collectionName === BlCollectionName.UniqueItems) {
      mongooseSchema.index({ blid: 1 });
    }

    //remove fields that the client shall not see
    mongooseSchema.set("toJSON", {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret.user;
        delete ret._id;
        delete ret.__v;
        delete ret.viewableFor;
      },
    });

    return this.createMongooseModel(mongooseSchema);
  }

  createMongooseModel(mongooseSchema: Schema) {
    try {
      if (mongoose.model(this.collectionName))
        return mongoose.model(this.collectionName);
    } catch (e) {
      if (e.name === "MissingSchemaError") {
        return mongoose.model(this.collectionName, mongooseSchema);
      }
    }
    return null;
  }

  createMongooseSchema(mschema: unknown): Schema {
    mschema["blid"] = {
      type: String,
    };

    mschema["lastUpdated"] = {
      type: Date,
      default: Date.now(),
    };

    mschema["creationTime"] = {
      type: Date,
      default: Date.now(),
    };

    mschema["comments"] = {
      type: [
        {
          id: String,
          msg: String,
          creationTime: {
            type: Date,
            default: Date.now(),
          },
          user: Schema.Types.ObjectId,
        },
      ],
    };

    mschema["active"] = {
      type: Boolean,
      default: true,
    };

    mschema["user"] = {
      type: {
        id: String,
        permission: String,
      },
    };

    mschema["viewableFor"] = {
      type: [String],
      default: [],
    };

    mschema["viewableForPermission"] = {
      type: String,
    };

    mschema["editableFor"] = {
      type: [String],
      default: [],
    };

    mschema["archived"] = {
      type: Boolean,
      default: false,
    };

    return new Schema(mschema);
  }
}
