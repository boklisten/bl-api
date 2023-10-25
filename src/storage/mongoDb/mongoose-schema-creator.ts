import mongoose, { Schema } from "mongoose";

import { BlCollectionName } from "../../collections/bl-collection";

export class MongooseModelCreator {
  constructor(
    private collectionName: BlCollectionName,
    private schema: Record<string, unknown>,
  ) {}

  create() {
    const mongooseSchema = this.createMongooseSchema(this.schema);
    if (this.collectionName === BlCollectionName.UniqueItems) {
      mongooseSchema.index({ blid: 1 });
    }

    //remove fields that the client shall not see
    mongooseSchema.set("toJSON", {
      transform: function (_doc, ret) {
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

  createMongooseSchema(mschema: Record<string, unknown>): Schema {
    const schema = new Schema(mschema);
    schema.add({
      blid: String,
      lastUpdated: {
        type: Date,
        default: Date.now(),
      },
      creationTime: {
        type: Date,
        default: Date.now(),
      },
      comments: {
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
      },
      active: {
        type: Boolean,
        default: true,
      },
      user: {
        type: {
          id: String,
          permission: String,
        },
      },
      viewableFor: {
        type: [String],
        default: [],
      },
      viewableForPermission: {
        type: String,
      },
      editableFor: {
        type: [String],
        default: [],
      },
      archived: {
        type: Boolean,
        default: false,
      },
    });
    return schema;
  }
}
