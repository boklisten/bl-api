
import {SESchema} from "../config/schema/se.schema";
import {SEDocument} from "../db/model/se.document";
import {SEErrorResponse} from "../response/se.error.response";
import {SEDbQuery} from "../query/se.db-query";

export class EndpointMongodb {
    schema: SESchema;

    constructor(schema: SESchema) {
        this.schema = schema;
    }

    get(dbQuery: SEDbQuery): Promise<SEDocument[]> {
        return new Promise((resolve, reject) => {
            this.schema.mongooseModel.find(dbQuery.filter, dbQuery.onlyGet).limit(dbQuery.limit).skip(dbQuery.skip).sort(dbQuery.sort).exec((error, docs) => {
                if (error) {
                    reject(new SEErrorResponse(403, 'client error', error));
                    return
                }

                let sdocs: SEDocument[] = [];

                for (let doc of docs) {
                   sdocs.push(new SEDocument(this.schema.title, doc));
                }

                if (sdocs.length == 0) {
                	reject(new SEErrorResponse(404));
                	return
				}

                resolve(sdocs);
            })
        });
    }

    post(document: SEDocument): Promise<SEDocument[]> {
        return new Promise((resolve, reject) => {
        	document.data.creationTime = new Date().toISOString();
            let newDocument = new this.schema.mongooseModel(document.data);

            newDocument.save((error, doc) => {
                if (error) {
                    reject(new SEErrorResponse(403, 'client error', error));
                    return
                }
                resolve([new SEDocument(this.schema.title, doc)]);
            });
        });
    }

    getById(id: string): Promise<SEDocument[]> {
        return new Promise((resolve, reject) => {
           this.schema.mongooseModel.findOne({_id: id}, (error, doc) => {
               if (error) {
                   reject(new SEErrorResponse(500, 'server error', error));
                   return;
               }

               if (doc === null) {
               		reject(new SEErrorResponse(404));
               		return;
			   }

               resolve([new SEDocument(this.schema.title, doc)]);
           });
        });
    }

    put(): Promise<SEDocument> {
        return Promise.reject('')
    }

    patch(id: string, doc: SEDocument): Promise<SEDocument[]> {
    	return new Promise((resolve, reject) => {
    	   this.schema.mongooseModel.findById(id, (error, document) => {
    			if (error)  {
    				reject(new SEErrorResponse(403, 'client error', error));
    				return
				}

				if (document === null) {
    				reject(new SEErrorResponse(404));
    				return
				}

    			document.set(doc);
    			document.set({lastUpdated: new Date().toISOString()});

    			document.save((error, updatedDocument) => {
    				if (error || updatedDocument === null) {
    					reject(new SEErrorResponse(500, 'server error', error));
    					return;
					}

					resolve([new SEDocument(this.schema.title, updatedDocument)]);
				});
		   })
    	});
    }

    deleteById(id: string): Promise<SEDocument[]> {
    	return new Promise((resolve, reject) => {
    		this.schema.mongooseModel.findByIdAndRemove(id, (error, doc) => {
    			if (error) {
    				reject(new SEErrorResponse(500, 'server error', error));
    				return;
				}

				if (doc === null) {
    				reject(new SEErrorResponse(404));
    				return;
				}
				resolve([new SEDocument(this.schema.title, doc)]);
			});
    	});
    }
}
