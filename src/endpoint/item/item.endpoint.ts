
import {Endpoint} from "../endpoint";
import {MongoHandler} from "../../db/mongoHandler";
import {Item} from "../../db/model/item/item";
import {IItem} from "../../db/model/item/item.interface";

export class ItemEndpoint implements Endpoint {

    collectionName: string;
    mongoHandler: MongoHandler;

    constructor(mongoHander: MongoHandler) {
        this.collectionName = 'items';
        this.mongoHandler = mongoHander;

    }

    handleRequest(req: Request, data: any): Promise<any> {
       return new Promise((resolve, reject) => {

       });
    }

    get(filter: any): Promise<IItem[]> {
        return new Promise((resolve, reject) => {
            Item.find((error, items) => {
                if (error) {
                    reject(error);
                    return
                }
                resolve(items)
            })
        });
    }

    post(item: IItem): Promise<IItem> {
        return new Promise((resolve, reject) => {
            let newItem = new Item(item);

            newItem.save((error, item) => {
                if (error) {
                    reject(error);
                    return
                }
                resolve(item)
            });
        });
    }

    getById(id: string): Promise<IItem> {
        return new Promise((resolve, reject) => {
           Item.findOne({_id: id}, (error, item) => {
               if (error || item === null) {
                   reject(error);
                   return
               }
               resolve(item);
           });
        });
    }

    put(): Promise<IItem> {
        return Promise.reject('')
    }

    patch(): Promise<IItem> {
        return Promise.reject('')
    }

    deleteById(id: string): Promise<IItem> {
        return Promise.reject('')
    }
}
