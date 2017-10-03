
import * as mongoose from 'mongoose'
import {ItemModel} from "./model/item/item.model";

export class MongoHandler {

    constructor() {
        mongoose.connect('mongodb://localhost:27017/bl_test', {useMongoClient: true, promiseLibrary: global.Promise});
        let item1 = new ItemModel({title: "signatur 1"});

        item1.save((err) => {
            if (err) {
                console.log('error', err);
            } else {
                console.log('inserted');
            }
        })

    }
}
