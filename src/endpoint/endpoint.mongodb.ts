
import {SESchema} from "../config/schema/se.schema";
import {SEDocument} from "../db/model/se.document";
import {SESchemaConfig} from "../config/schema/se.schema.config";

export class EndpointMongodb {
    schema: SESchema;

    constructor(schema: SESchema) {
        this.schema = schema;
    }

    get(filter: any): Promise<SEDocument[]> {
        console.log('expressmongo.get called with: ', filter);

        return new Promise((resolve, reject) => {
            this.schema.mongooseModel.find((error, docs) => {
                if (error) {
                    console.log('got an error in expressmongo.get', error);
                    reject(error);
                    return
                }

                let sdocs: SEDocument[] = [];

                for (let doc of docs) {
                   sdocs.push(new SEDocument(this.schema.title, doc));
                }

                console.log('got some docs');
                resolve(sdocs);
            })
        });
    }

    post(document: SEDocument): Promise<SEDocument> {
        console.log('expressmongo.post called with', document);
        return new Promise((resolve, reject) => {
            let newDocument = new this.schema.mongooseModel(document.data);

            newDocument.save((error, doc) => {
                if (error) {
                    reject(error);
                    return
                }
                resolve(new SEDocument(this.schema.title, doc))
            });
        });
    }

    getById(id: string): Promise<SEDocument> {
        return new Promise((resolve, reject) => {
           this.schema.mongooseModel.findOne({_id: id}, (error, doc) => {
               if (error || doc === null || doc == undefined) {
                   reject(error);
                   return
               }
               resolve(new SEDocument(this.schema.title, doc));
           });
        });
    }

    put(): Promise<SEDocument> {
        return Promise.reject('')
    }

    patch(): Promise<SEDocument> {
        return Promise.reject('')
    }

    deleteById(id: string): Promise<SEDocument> {
        return Promise.reject('')
    }
}
