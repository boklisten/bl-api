import mongoose, { Model, Schema } from "mongoose";

import { BlCollectionName } from "../../collections/bl-collection";

export class MongooseModelCreator<T> {
  constructor(
    private collectionName: BlCollectionName,
    private schema: Schema,
  ) {}

  create(): Model<T> {
    return mongoose.model<T>(
      this.collectionName,
      this.standardizeSchema(this.schema),
    );
  }

  private standardizeSchema(schema: Schema): Schema {
    schema.add({
      blid: String,
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

    // Enable automatic timestamps
    schema.set("timestamps", { createdAt: "creationTime", updatedAt: "lastUpdated"});

    return schema;
  }
}
