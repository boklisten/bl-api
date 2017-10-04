


import * as mongoose from 'mongoose';
import {ItemModel} from "./item.model";
import {ItemSchema} from "./item.schema";

export let Item = mongoose.model<ItemModel>('item', ItemSchema);
