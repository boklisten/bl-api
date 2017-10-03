
import {Model} from "mongoose";
import {itemSchema} from "./item.schema";
import * as mongoose from 'mongoose';

export let ItemModel = mongoose.model('item', itemSchema);
