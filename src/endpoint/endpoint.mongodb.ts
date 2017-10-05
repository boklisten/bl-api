
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
            this.schema.mongooseModel.find(filter,(error, docs) => {
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
        	document.data.creationTime = new Date().toISOString();
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

    patch(id: string, doc: SEDocument): Promise<SEDocument> {
    	return new Promise((resolve, reject) => {
    	   this.schema.mongooseModel.findById(id, (error, document) => {
    			if (error || document === null) {
    				reject(error);
    				return;
				}

				document.set(doc);
    			document.set({lastUpdated: new Date().toISOString()});
    			document.save((error, updatedDocument) => {
    				if (error || updatedDocument === null) {
    					reject(error);
    					return;
					}

					resolve(new SEDocument(this.schema.title, updatedDocument));
				});
		   })
    	});
    }

    deleteById(id: string): Promise<SEDocument> {
        return Promise.reject('')
    }
}
