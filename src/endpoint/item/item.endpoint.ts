
import {Endpoint} from "../endpoint";
import {ItemDocument} from "./item.document";
import {MongoHandler} from "../../db/mongoHandler";
import {ItemModel} from "../../db/model/item/item.model";
import {Item} from "../../db/model/item/item";

export class ItemEndpoint implements Endpoint {

    collectionName: string;
    mongoHandler: MongoHandler;

    constructor(mongoHander: MongoHandler) {
        this.collectionName = 'items';
        this.mongoHandler = mongoHander;

    }

    get(): Promise<ItemDocument[]> {
        return Promise.reject('')
    }

    post(): Promise<ItemDocument> {
        return Promise.reject('')
    }

    getById(id: string): Promise<ItemDocument> {
        let newItem = new Item({title: 'Signatur 1'});

        newItem.save((error, item) => {
           if (error) {
               console.log('the error', error);
               return

           }
           console.log('saved the item', item)
        });

        return Promise.reject('')
    }

    put(): Promise<ItemDocument> {
        return Promise.reject('')
    }

    patch(): Promise<ItemDocument> {
        return Promise.reject('')
    }

    deleteById(id: string): Promise<ItemDocument> {
        return Promise.reject('')
    }
}
