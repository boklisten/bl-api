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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ret.id = ret._id;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete ret.user;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete ret._id;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete ret.__v;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete ret.viewableFor;
      },
    });

    // Enable automatic timestamps
    schema.set("timestamps", {
      createdAt: "creationTime",
      updatedAt: "lastUpdated",
    });

    return schema;
  }
}
