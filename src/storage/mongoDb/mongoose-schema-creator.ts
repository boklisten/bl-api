import mongoose from "mongoose";

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

  createMongooseModel(mongooseSchema: mongoose.Schema) {
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

  createMongooseSchema(mschema: unknown): mongoose.Schema {
    mschema["blid"] = {
      type: mongoose.Schema.Types.String,
    };

    mschema["lastUpdated"] = {
      type: mongoose.Schema.Types.Date,
      default: Date.now(),
    };

    mschema["creationTime"] = {
      type: mongoose.Schema.Types.Date,
      default: Date.now(),
    };

    mschema["comments"] = {
      type: [
        {
          id: mongoose.Schema.Types.String,
          msg: mongoose.Schema.Types.String,
          creationTime: {
            type: mongoose.Schema.Types.Date,
            default: Date.now(),
          },
          user: mongoose.Schema.Types.ObjectId,
        },
      ],
    };

    mschema["active"] = {
      type: mongoose.Schema.Types.Boolean,
      default: true,
    };

    mschema["user"] = {
      type: {
        id: mongoose.Schema.Types.String,
        permission: mongoose.Schema.Types.String,
      },
    };

    mschema["viewableFor"] = {
      type: [mongoose.Schema.Types.String],
      default: [],
    };

    mschema["viewableForPermission"] = {
      type: mongoose.Schema.Types.String,
    };

    mschema["editableFor"] = {
      type: [mongoose.Schema.Types.String],
      default: [],
    };

    mschema["archived"] = {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    };

    return new mongoose.Schema(mschema);
  }
}
