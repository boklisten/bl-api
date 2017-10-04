
import * as mongoose from 'mongoose';
import {IItem} from "./item.interface";

export interface ItemModel extends IItem, mongoose.Document {

}
