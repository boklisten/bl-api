import mongoose, { Schema } from "mongoose";

import { BlCollectionName } from "../../collections/bl-collection";

export class MongooseModelCreator<T> {
  constructor(
    private collectionName: BlCollectionName,
    private schema: Schema<T>,
  ) {}

  create(): mongoose.Model<T> {
    return mongoose.model(
      this.collectionName,
      this.standardizeSchema(this.schema),
    );
  }

  private standardizeSchema<T>(schema: Schema<T>): Schema<T> {
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

    if (this.collectionName === BlCollectionName.UniqueItems) {
      schema.index({ blid: 1 });
    }

    //remove fields that the client shall not see
    schema.set("toJSON", {
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete ret.user;
        delete ret._id;
        delete ret.__v;
        delete ret.viewableFor;
      },
    });
    return schema;
  }
}
