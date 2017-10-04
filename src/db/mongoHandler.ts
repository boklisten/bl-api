
import {ItemModel} from "./model/item/item.model";
import * as mongoose from "mongoose";
import {CollectionDocument} from "./document/collection-document";

export let Schema = mongoose.Schema;

export class MongoHandler {

    constructor() {
        mongoose.connect('mongodb://localhost:27017/bl_test', {useMongoClient: true, promiseLibrary: global.Promise});
    }

    find(filter: any, model: mongoose.Model<mongoose.Document>) {


       return Promise.reject('')
    }

    findOne(filter: any, model: mongoose.Model<mongoose.Document>): Promise<CollectionDocument> {

        model.findOne(filter, (err, document) => {
           if (err) {
               console.log('got error', err)

           }
           console.log('the document::: ', document)
        });
       return Promise.reject('')

    }
}
